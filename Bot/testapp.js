// noinspection JSVoidFunctionReturnValueUsed
import TelegramBot from "node-telegram-bot-api";
import http from "http";
import os from "os";
import fs from "fs";
import xlsx from "xlsx";
import PDFDocument from "pdfkit";
import path from "path";
import axios from "axios";
import cron from "node-cron";

const token = "7388307618:AAGauyc-oRfZ38agwHqn0dh9VPzlHJd-TCc";
// const token = "7486569147:AAGIegg4cjIvYmhjNDfd1uVAMd8sSLKat3Q";
let bot = new TelegramBot(token, {polling: true});
// console.log(bot);
console.log("Bot started");
const HOSTIP = getWiFiIPAddress();

function getWiFiIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const info of interfaceInfo) {
            if (info.family === 'IPv4' && !info.internal) {
                // Check if the interface has a name containing "wl" (common for Wi-Fi interfaces)
                if (interfaceName.toLowerCase().includes('wl')) {
                    return info.address;
                }
            }
        }
    }

    return null;
}

console.log(HOSTIP);
const PORT = 8888;
const helpMessage = "Here's what you can do:\n\n1. Search for a product:\n   /product <product_id>\n   (e.g., /product 1001)\n\n2. Search by keyword\n    /search <keyword>\n    (e.g.,/search bluetooth)\n\n3.Advance Search\n    /advancesearch\n\n4.Choose From Category\n    /category\n\n5.Show all shops\n    /allshop\n\n6.Nearby Shop\n    Just send us a location\n\n7.Shop by District\n    /shops\n\n8. Frequently asked questions\n    /allquestion\n\n9. Questions by Keyword \n    /question <keyword>\n\n10. Get help\n    /help\n\n11.Rock Paper Scissors\n    /rps\n\n12. End the conversation\n    /end";
const advSearchThread = {}
const commentThread = {};
const helpOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: '❓ Get help', callback_data: '/help'}],
            [{text: '🫶 Rating and Comment', callback_data: '/end'}]
        ]
    })
};
const availableCommands = [
    '/start',
    '/end',
    '/allshop',
    '/shops',
    '/help',
    '/allquestion',
    '/search',
    '/product',
    '/advancesearch',
    '/question',
    '/category',
    '/rps',
    'restart',
    ''
];
const oneTimeKeyboardOptions = {
    reply_markup: {
        keyboard: [
            ['/start', '/end'],
            ['/advancesearch', '/category'],
            [{text: 'Shops Nearby', request_location: true}, '/allshop', '/shops'],
            ['/help', '/allquestion ']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
    }
};
let isMainMenu = true;

bot.on('message', async (msg) => {
    let chatId = msg.chat.id;
    let message = msg.text;
    let name = msg.chat.first_name;
    await storeCustomerInfo(chatId, name);

    if (isMainMenu) {
        if (msg.location) {
            let latitude = msg.location.latitude;
            let longitude = msg.location.longitude;
            searchByLocation(chatId, latitude, longitude);
        } else {
            try {
                if (!message.startsWith('/')) {
                    bot.sendMessage(chatId, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                } else if (!(availableCommands.includes(message) || message.startsWith("/question") || message.startsWith("/search") || message.startsWith("/product") || message.startsWith("/restart"))) {
                    bot.sendMessage(chatId, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                }
            } catch (e) {
                console.log(e)
            }
        }
    }

})
bot.onText(/\/start/, async (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = true;
    let chatId = msg.chat.id;
    let name = msg.chat.first_name;
    const welcomeMessage = `Hello ${name}! Welcome to the ERB ChatBot!\n\n` + helpMessage;
    bot.sendMessage(chatId, welcomeMessage, oneTimeKeyboardOptions);
    isMainMenu = true;
})
bot.onText(/\/help/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/help");
    bot.sendMessage(chatId, helpMessage, helpOptions).then(() => {
        isMainMenu = true
    }).then(() => {
        askNotify(chatId);
    })
});

//PRODUCT
bot.onText(/\/product(?:\s+(\d+))?/, (msg, match) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    // console.log("searched by product id");
    let chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/product");
    let resp = match[1]; // Get the product ID from the match
    if (resp !== undefined) {
        const options = {
            hostname: HOSTIP,
            port: PORT,
            path: "/product/select/" + resp,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                let products = JSON.parse(data);
                setSearchData(chatId, products, resp, "products");
                let message = "Search results:\n\n";
                if (products.length !== 0) {
                    // Format the search results
                    products.forEach(product => {
                        message += `[${product.productName}](${product.productLink})\n`;
                        message += `Price: $${product.price}\n`;
                        message += `Description: ${product.description}\n\n`;
                    });
                } else {
                    message = "No products found";
                }
                // Send the formatted message to the user
                bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown"
                }).then(() => {
                    bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                        reply_markup: resultOption
                    });
                }).finally(async () => {
                    if (await checkPromotion(products)) {
                        await sendPromotion(chatId);
                    }
                })
            });
        });
        req.on("error", (err) => {
            console.log("This error?");
            console.log(err);
        });
        req.end();
    } else {
        // If the user just types /product without a product ID
        bot.sendMessage(chatId, "Please enter a product ID (a number).");
    }
    isMainMenu = true;
});
bot.onText(/\/search(?:\s+(.+))?/, (msg, match) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/search");
    // console.log(chatId);
    if (!match[1]) {
        bot.sendMessage(msg.chat.id, "Please provide a search keyword after the /search command.", {
            parse_mode: "Markdown"
        });
        return;
    }
    let resp1 = encodeURIComponent(match[1]);
    try {
        searchProductKeyword(chatId, resp1)
        isMainMenu = true;
    } catch (e) {
        console.log(e)
    }
});
bot.onText(/\/category/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{text: '📱 Electronics ⌚️', callback_data: 'Electronics'}],
            [{text: '🏠 Home Appliances 🧻', callback_data: 'Home Appliances'}],
            [{text: '🛋 Furniture 🛏️', callback_data: 'Furniture'}],
            [{text: '🛍 Clothing 👕', callback_data: 'Clothing'}],
            [{text: '⚽ Sports & Outdoor 🏃🏻', callback_data: 'Sports & Outdoor'}]
        ]
    };
    bot.sendMessage(chatId, 'Please select your preferred search option:', {reply_markup: keyboard})
});
bot.onText(/\/advancesearch/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }
    isMainMenu = false;
    let chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{text: 'Search by Keyword', callback_data: 'search_by_keyword'}],
            [{text: 'Search by Price Range', callback_data: 'search_by_price'}],
            [{text: 'Search by Keyword and Price Range', callback_data: 'search_by_both'}]
        ]
    };
    bot.sendMessage(chatId, 'Please select your preferred search option:', {reply_markup: keyboard})

});

function searchProductKeyword(chatId, resp1) {
    // console.log("searched Pro")
    const options = {
        hostname: HOSTIP,
        port: PORT,
        path: "/product/search?keyword=" + resp1,
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }
    const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            let products = JSON.parse(data);
            setSearchData(chatId, products, resp1, "products");
            if (products.length === 0) {
                bot.sendMessage(chatId, "Sorry, no products found for your search.", helpOptions, {
                    parse_mode: "Markdown"
                });
                return null;
            } else {

                let message = "Total Items:" + products.length + "\nSearch results:\n\n";
                bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown"
                }).then(() => {

                    let productPromises = [];

                    try {
                        products.forEach(product => {
                            let productMessage = "";
                            productMessage += `[${product.productName}](${product.productLink})\n`;
                            productMessage += `Category: ${product.category}\n`
                            productMessage += `Price: $${product.price}\n`;
                            productMessage += `Description: ${product.description}\n`;
                            // productMessage += `${product.productLink}\n\n`;
                            productPromises.push(bot.sendMessage(chatId, productMessage, {
                                parse_mode: "Markdown"
                            }));
                        });
                    } catch (e) {
                        // Handle any errors
                    }

                    Promise.all(productPromises)
                        .then(() => {
                            bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                                reply_markup: resultOption
                            });
                        })
                        .catch((error) => {
                            // Handle any errors
                            console.error(error);
                        }).finally(async () => {
                        if (await checkPromotion(products)) {
                            await sendPromotion(chatId);
                        }
                    })
                });
                isMainMenu = true
                return null;
            }
        });
    });
    req.on("error", (err) => {

        console.log("This error?");
        console.log(err);
    });
    req.end();
    advSearchThread[chatId] = false;
    return "Successfully found";
}

function searchProductCategory(chatId, resp) {
    resp = encodeURIComponent(resp)
    if (resp !== undefined) {
        const options = {
            hostname: HOSTIP,
            port: PORT,
            path: "/product/category/" + resp,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", async () => {
                let products = JSON.parse(data);
                setSearchData(chatId, products, resp, "products");
                if (products.length === 0) {
                    bot.sendMessage(chatId, 'Sorry, no products found for your search.', helpOptions, {
                        parse_mode: 'Markdown'
                    });
                } else {
                    let message = "Total Items:" + products.length + "\nSearch results:\n\n";
                    bot.sendMessage(chatId, message, {
                        parse_mode: "Markdown"
                    }).then(() => {
                        let productPromises = [];
                        try {
                            products.forEach(product => {
                                let productMessage = "";
                                productMessage += `[${product.productName}](${product.productLink})\n`;
                                productMessage += `Category: ${product.category}\n`
                                productMessage += `Price: $${product.price}\n`;
                                productMessage += `Description: ${product.description}\n`;
                                // productMessage += `${product.productLink}\n\n`;

                                productPromises.push(bot.sendMessage(chatId, productMessage, {
                                    parse_mode: "Markdown"
                                }));
                            });
                        } catch (e) {
                            // Handle any errors
                        }
                        Promise.all(productPromises)
                            .then(() => {
                                bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                                    reply_markup: resultOption
                                });
                            })
                            .catch((error) => {
                                // Handle any errors
                                console.error(error);
                            }).finally(async () => {
                            if (await checkPromotion(products)) {
                                await sendPromotion(chatId);
                            }
                        });
                    })
                    isMainMenu = true
                    return null;
                }
            });
        });
        req.on("error", (err) => {
            console.log("This error?");
            console.log(err);
        });
        req.end();
        // bot.off("message");
        return "Successfully found";
    }
}

function advanceSearch(chatId, keyword, min, max) {
    let url = `/product/advancesearch?keyword=${keyword}&r1=${min}&r2=${max}`
    if (keyword == null || keyword === "") {
        url = `/product/advancesearch?keyword=&r1=${min}&r2=${max}`
    }
    const options = {
        hostname: HOSTIP,
        port: PORT,
        path: url,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    let req = http.request(options, (res) => {
        // if(!isAdvancedSearchActive) return;
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            let products = JSON.parse(data);
            setSearchData(chatId, products, keyword, "products");
            if (products.length === 0) {
                bot.sendMessage(chatId, 'Sorry, no products found for your advance search.', helpOptions, {
                    parse_mode: 'Markdown'
                });
            } else {
                let message = "Total Items:" + products.length + "\nSearch results:\n\n";
                bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown"
                }).then(() => {

                    let productPromises = [];

                    try {
                        products.forEach(product => {
                            let productMessage = "";
                            productMessage += `[${product.productName}](${product.productLink})\n`;
                            productMessage += `Category: ${product.category}\n`
                            productMessage += `Price: $${product.price}\n`;
                            productMessage += `Description: ${product.description}\n`;
                            // productMessage += `${product.productLink}\n\n`;

                            productPromises.push(bot.sendMessage(chatId, productMessage, {
                                parse_mode: "Markdown"
                            }));
                        });
                    } catch (e) {
                        // Handle any errors
                    }

                    Promise.all(productPromises)
                        .then(() => {
                            bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                                reply_markup: resultOption
                            });
                        })
                        .catch((error) => {
                            // Handle any errors
                            console.error(error);
                        }).finally(async () => {
                        if (await checkPromotion(products)) {
                            await sendPromotion(chatId);
                        }
                    });
                })
                isMainMenu = true
                return null;
            }
        });
    });
    req.on("error", (err) => {
        console.log("This error?");
        console.log(err);
    });
    req.end();
    // bot.off("message");
    advSearchThread[chatId] = false;
    return "Successfully found";
}

//PRODUCT END

//SHOP
bot.onText(/\/shops/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{text: 'Hong Kong Island️', callback_data: 'Hong Kong Island'}],
            [{text: 'Kowloon', callback_data: 'Kowloon'}],
            [{text: 'New Territories', callback_data: 'New Territories'}],
        ]
    };
    bot.sendMessage(chatId, 'Please select your District:', {reply_markup: keyboard})
});

function searchByDistrict(chatId, resp) {
    resp = encodeURIComponent(resp)
    if (resp !== undefined) {
        const options = {
            hostname: HOSTIP,
            port: PORT,
            path: "/shop/selectdistrict/" + resp,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", async () => {
                // console.log(data)
                let shops = JSON.parse(data);
                setSearchData(chatId, shops, resp, "shops");
                let message = `Showing all shops in ${decodeURIComponent(resp)}`;
                bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown"
                }).then(() => {
                        let shopPromises = [];
                        try {
                            shops.forEach(shop => {
                                let shopMessage = "";

                                shopMessage += `*${shop.shopName}* ${shop.status}\n\n`;

                                let addressParts = shop.address.split(",");
                                let relevantAddress = addressParts.slice(2).join(", ").trim();
                                let googleMapsLink = `[${shop.address}](https://www.google.com/maps/dir/?api=1&origin=my+location&destination=${encodeURIComponent(relevantAddress)}&zoom=14)`;
                                shopMessage += `Address: ${googleMapsLink}\n\n`;
                                shopMessage += `Open Time: ${shop.open.start} \nEnd Time:${shop.open.end}\n\n`;
                                shopMessage += `Tel: ${shop.tel}`;
                                shopPromises.push(bot.sendMessage(chatId, shopMessage, {
                                    parse_mode: "Markdown"
                                }));

                            })
                        } catch
                            (e) {
                            console.log(e)
                        }
                        Promise.all(shopPromises)
                            .then(() => {
                                bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                                    reply_markup: resultOption
                                });
                            })
                            .catch((error) => {
                                // Handle any errors
                                console.error(error);
                            })
                    }
                );
            });
        });
        req.on("error", (err) => {

            console.log("This error?");
            console.log(err);
        });
        req.end();
        isMainMenu = true;
        return "Successfully found";
    }
}

bot.onText(/\/allshop/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }
    isMainMenu = false;
    let chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/shop");
    const options = {
        hostname: HOSTIP,
        port: PORT,
        path: "/shop/get",
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }
    const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            let shops = JSON.parse(data);
            let message = "Showing all shops";
            setSearchData(chatId, shops, "All Shops", "shops");
            bot.sendMessage(chatId, message, {
                parse_mode: "Markdown"
            }).then(() => {
                    let shopPromises = [];
                    try {
                        shops.forEach(shop => {
                            let shopMessage = "";

                            shopMessage += `*${shop.shopName}* ${shop.status}\n\n`;
                            let addressParts = shop.address.split(",");
                            let relevantAddress = addressParts.slice(2).join(", ").trim();
                            let googleMapsLink = `[${shop.address}](https://www.google.com/maps/dir/?api=1&origin=my+location&destination=${encodeURIComponent(relevantAddress)}&zoom=14)`;
                            shopMessage += `Address: ${googleMapsLink}\n\n`;
                            shopMessage += `Open Time: ${shop.open.start} \nEnd Time:${shop.open.end}\n`;
                            shopMessage += `Tel: ${shop.tel}`;

                            shopPromises.push(bot.sendMessage(chatId, shopMessage, {
                                parse_mode: "Markdown"
                            }));

                        })
                    } catch
                        (e) {
                        console.log(e)
                    }
                    Promise.all(shopPromises)
                        .then(() => {
                            bot.sendMessage(chatId, "Search completed. What else can I help you with?", {
                                reply_markup: resultOption
                            });
                        })
                        .catch((error) => {
                            // Handle any errors
                            console.error(error);
                        })
                }
            );
        });
    });
    req.on("error", (err) => {
        console.log("This error?");
        console.log(err);
    });
    req.end();
    isMainMenu = true;
    return "Successfully found";

})

function searchByLocation(chatId, lat, lng) {
    storeCustomerUsage(chatId, "nearby_shop");
    const options = {
        hostname: HOSTIP,
        port: 8888,
        path: "/shop/searchlocation?lat=" + lat + "&lng=" + lng,
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }
    const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            let shop = JSON.parse(data);
            let message = "Total shops nearby:" + shop.length + "\nSearch results:\n\n";
            bot.sendMessage(chatId, message, {
                parse_mode: "Markdown"
            }).then(() => {
                let shopPromises = [];
                try {
                    shop.forEach(shop => {
                        let shopMessage = "";
                        shopMessage += `*${shop.shopName}* ${shop.status}\n\n`;
                        let addressParts = shop.address.split(",");
                        let relevantAddress = addressParts.slice(2).join(", ").trim();
                        let googleMapsLink = `[${shop.address}](https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(relevantAddress)}&zoom=14)`
                        // let googleMapsLink = `[${shop.address}](https://www.google.com/maps/dir/?api=1&origin=my+location&destination=${encodeURIComponent(relevantAddress)}&zoom=14)`;
                        shopMessage += `Address: ${googleMapsLink}\n\n`;
                        shopMessage += `Open Time: ${shop.open.start}\n End Time:${shop.open.end}\n\n`;
                        shopMessage += `Tel: ${shop.tel}`;

                        shopPromises.push(bot.sendMessage(chatId, shopMessage, {
                            parse_mode: "Markdown"
                        }));
                    });
                } catch (e) {
                    // Handle any errors
                }

                Promise.all(shopPromises)
                    .then(() => {
                        bot.sendMessage(chatId, "What else can I help you with?", helpOptions, {
                            parse_mode: "Markdown"
                        });
                    })
                    .catch((error) => {
                        // Handle any errors
                        console.error(error);
                    })
            });
        });
    });
    req.on("error", (err) => {

        console.log("This error?");
        console.log(err);
    });
    req.end();
    return "Successfully found";
}

//SHOP END

//QUESTION
bot.onText(/\/allquestion/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/allquestion");
    const options = {
        hostname: HOSTIP,
        port: 8888,
        path: "/question/get",
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }
    const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", async () => {
            try {
                let questions = await JSON.parse(data);
                let message = "Showing all Questions";
                bot.sendMessage(chatId, message, {
                    parse_mode: "Markdown"
                }).then(() => {

                    let sendQuestionsPromises = [];
                    for (let i = 0; i < questions.length; i++) {
                        let question = questions[i];
                        let questionMessage = "";
                        questionMessage += `*${question.question}*\n\n`;
                        questionMessage += `${question.answer}\n`;


                        if (question.hasOwnProperty('questionPic')) {
                            // If the question has an associated image, send the image first
                            sendQuestionsPromises.push(
                                bot.sendPhoto(chatId, question.questionPic, {
                                    caption: questionMessage,
                                    parse_mode: "Markdown"
                                })
                            );
                        } else {
                            // If no image, just send the question and answer
                            sendQuestionsPromises.push(
                                bot.sendMessage(chatId, questionMessage, {
                                    parse_mode: "Markdown"
                                })
                            );
                        }
                    }

                    Promise.all(sendQuestionsPromises)
                        .then(() => {
                            bot.sendMessage(chatId, "What else can I help you with?", helpOptions, {
                                parse_mode: "Markdown"
                            });
                            bot.sendMessage(chatId, "If that does not solve your problem, feel free to contact our staff.\n    https://t.me/elvificent", {
                                parse_mode: "Markdown"
                            })
                        })
                        .catch((error) => {
                            console.error(error);
                        })
                });
            } catch (e) {
                console.log(e);
            }
        });
    });
    req.on("error", (err) => {

        console.log("This error?");
        console.log(err);
    });
    req.end();
    isMainMenu = true;
    return "Successfully found";

})

bot.onText(/\/question(?:\s+(.+))?/, (msg, match) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    var chatId = msg.chat.id;
    storeCustomerUsage(chatId, "/question");
    if (!match[1]) {
        bot.sendMessage(chatId, "Please provide a search keyword after the /question command.", {
            parse_mode: "Markdown"
        });
        return;
    }
    var resp1 = encodeURIComponent(match[1]);
    const options = {
        hostname: HOSTIP,
        port: PORT,
        path: "/question/get/" + resp1,
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }
    const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            let sendQuestionsPromises = [];
            let questions = JSON.parse(data);
            if (questions.length === 0) {
                bot.sendMessage(chatId, "Sorry, no questions found for your search.", helpOptions, {
                    parse_mode: "Markdown"
                });
            } else {
                let message = "\nSearch results:\n\n";

                bot.sendMessage(chatId, message, {
                        parse_mode: "Markdown"
                    }
                ).then(() => {
                    for (let i = 0; i < questions.length; i++) {
                        let question = questions[i];
                        let questionMessage = "";
                        questionMessage += `*${question.question}*\n\n`;
                        questionMessage += `${question.answer}\n`;
                        if (question.hasOwnProperty('questionPic')) {
                            sendQuestionsPromises.push(
                                bot.sendPhoto(chatId, question.questionPic, {
                                    caption: questionMessage,
                                    parse_mode: "Markdown"
                                })
                            );
                        } else {
                            // If no image, just send the question and answer
                            sendQuestionsPromises.push(
                                bot.sendMessage(chatId, questionMessage, {
                                    parse_mode: "Markdown"
                                })
                            );
                        }
                    }
                    // console.log("bye")
                    Promise.all(sendQuestionsPromises).then(() => {
                        bot.sendMessage(chatId, "What else can I help you with?", helpOptions, {
                            parse_mode: "Markdown"
                        });
                        bot.sendMessage(chatId, "If that does not solve your problem, feel free to contact our staff.\n    https://t.me/elvificent", {
                            parse_mode: "Markdown"
                        })
                    })
                });

            }
        });
    });
    req.on("error", (err) => {

        console.log("This error?");
        console.log(err);
    });
    req.end();
    isMainMenu = true;

})
//QUESTION END

bot.onText(/\/restart/, (msg) => {
    let chatId = msg.chat.id;

    // Stop the bot
    bot.stopPolling()
        .then(() => {
            // Restart the bot
            bot.startPolling();

            // Send a message to the user with the keyboard options
            bot.sendMessage(chatId, 'Bot has been restarted. What would you like to do?', helpOptions);
        })
        .catch((err) => {
            console.error('Error restarting the bot:', err);
            bot.sendMessage(chatId, 'Failed to restart the bot. Please try again later.');
        });
});
const resultOption = {
    inline_keyboard: [
        [{text: '🖨️ Export', callback_data: 'export'}, {text: '❓ Get help', callback_data: '/help'}],
        [{text: '🫶 Rating and Comment', callback_data: '/end'}]
    ]
}

//EXPORT
async function exportToPDF(chatId) {
    let datapdf = await fetchData(chatId);
    let datakey = decodeURIComponent(await fetchKey(chatId));
    let dataType = await fetchType(chatId);
    if (datakey === "null") {
        datakey = "Price"
    }
    if (datapdf === null) {
        datapdf = ""
    }
    return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument();
                // Pipe the PDF document to a file
                let pdfFilePath = `search_results_${chatId}.pdf`;
                const pdfFileStream = fs.createWriteStream(pdfFilePath);
                doc.pipe(pdfFileStream);

                // Add a title to the PDF
                doc.fontSize(18).text(`Search results for "${datakey}"`, {
                    align: 'center'
                });
                doc.moveDown();
                // Add the product information to the PDF
                datapdf.forEach(product => {
                        if (dataType === 'products') {
                            doc.fontSize(14).text(`${product.productName}`);
                            doc.fontSize(12).text(`Category: ${product.category}`);
                            doc.fontSize(12).text(`Price: $${product.price}`);
                            doc.fontSize(12).text(`Description: ${product.description}`);
                        } else {
                            doc.fontSize(14).text(`${product.shopName} ${product.status}`);
                            doc.fontSize(12).text(`District: ${product.district}`);
                            doc.fontSize(12).text(`Address: ${product.address}`);
                            doc.fontSize(12).text(`Opening Time: ${product.open.start} - ${product.open.end}`);
                        }
                        doc.moveDown();
                    }
                )
                ;
                // Finalize the PDF document
                doc.end();
                pdfFileStream.on('finish', async () => {
                    await bot.sendDocument(chatId, pdfFilePath, {caption: "Here is the PDF file"});
                    await bot.sendMessage(chatId, "What else can I help you with?", helpOptions, {
                        parse_mode: "Markdown"
                    });
                    await removeData(chatId);
                    await fs.promises.unlink(pdfFilePath); // Delete the PDF file
                    resolve();
                });
                pdfFileStream.on('error', (err) => {
                    console.error('Error writing PDF file:', err);
                    reject(err);
                });
            } catch
                (err) {
                console.log(err)
                reject(err);
            }
        }
    )
}

async function exportToExcel(chatId) {
    try {
        let datapdf = await fetchData(chatId);
        let datakey = decodeURIComponent(await fetchKey(chatId));
        if (datakey == null) {
            datakey = "Price"
        }
        // Create a new workbook
        const workbook = xlsx.utils.book_new();
        // Create a worksheet
        const worksheet = xlsx.utils.json_to_sheet(datapdf);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Search Results');

        // Add a title to the worksheet
        worksheet['!cols'] = [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 50}];
        worksheet['A1'] = {
            v: `Search results for "${datakey}"`,
            t: 's',
            s: {font: {sz: 16, bold: true}}
        };
        // Generate the Excel file
        let excelFilePath = path.join(process.cwd(), `search_results_${chatId}.xlsx`);
        await xlsx.writeFile(workbook, excelFilePath);

        console.log('Excel file generated:', excelFilePath);
        await bot.sendDocument(chatId, excelFilePath, {caption: "Here is the Excel file"});
        await bot.sendMessage(chatId, "What else can I help you with?", helpOptions, {
            parse_mode: "Markdown"
        });
        await removeData(chatId);

        // Remove the Excel file after sending it
        await fs.promises.unlink(excelFilePath);
        console.log('Excel file deleted:', excelFilePath);

        return excelFilePath;
    } catch (err) {
        console.error('Error generating Excel file:', err);
        throw err;
    }
}

let chatIdData = {};

function fetchData(chatId) {
    if (chatIdData[chatId]) {
        return chatIdData[chatId].productsData;
    } else {
        return null;
    }
}

function fetchKey(chatId) {
    if (chatIdData[chatId]) {
        return chatIdData[chatId].keyword;
    } else {
        return null;
    }
}

function fetchType(chatId) {
    if (chatIdData[chatId]) {
        return chatIdData[chatId].dataType;
    } else {
        return null;
    }
}

function setSearchData(chatId, products, keyword, dataType) {
    chatIdData[chatId] = {
        dataId: chatId,
        keyword: keyword,
        productsData: products,
        dataType: dataType
    };
}

function removeData(chatId) {
    if (chatIdData[chatId]) {
        delete chatIdData[chatId];
    }
}

//EXPORT END

//comments
let satisfaction;

function end(chatId) {
    if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
        return
    } else {
        isMainMenu = false;
        storeCustomerUsage(chatId, "/end");
        const satisfactionOptions = [
            [{text: '😀 Very Satisfied', callback_data: 'very_satisfied'}, {
                text: '😊 Satisfied',
                callback_data: 'satisfied'
            }],
            [{text: '😐 Neutral', callback_data: 'neutral'}],
            [{text: '😞 Dissatisfied', callback_data: 'dissatisfied'}, {
                text: '😠 Very Dissatisfied',
                callback_data: 'very_dissatisfied'
            }]
        ];

        const satisfactionKeyboard = {
            reply_markup: JSON.stringify({
                inline_keyboard: satisfactionOptions
            })
        };
        bot.sendMessage(chatId, 'Please rate your satisfaction with the service:', satisfactionKeyboard);
    }
}

bot.onText(/\/end/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }

    isMainMenu = false;
    let chatId = msg.chat.id;
    end(chatId);
})

function comment(chatId) {
    isMainMenu = false;
    const commentOptions = [
        [{text: 'Leave a comment', callback_data: 'leave_comment'}],
        [{text: 'Skip', callback_data: 'skip_comment'}]
    ];
    const commentKeyboard = {
        reply_markup: JSON.stringify({
            inline_keyboard: commentOptions
        })
    };
    bot.sendMessage(chatId, 'Would you like to leave a comment?', commentKeyboard);
}

async function insertComment(chatId, name, satisfaction, comments) {
    const data = {
        chatId: chatId,
        name: name,
        satisfaction: satisfaction,
        comment: comments
    }
    axios.post('http://localhost:8888/customers/comment', data, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(() => {
    }).catch((error) => {
        console.error(error);
    });
}

//comments end

//rock paper scissors
let gameThread = {};
let playerChoice;
let botChoice;
bot.onText(/\/rps/, (msg) => {
    if (advSearchThread[msg.chat.id] === true || commentThread[msg.chat.id] === true) {
        return
    }
    storeCustomerUsage(msg.chat.id, "/rps");
    let chatId = msg.chat.id;
    if (gameStarted(chatId)) {
        bot.sendMessage(chatId, 'A game is already in progress. Please wait for it to finish.');
        return;
    }
    gameThread[chatId] = true;
    const keyboard = [
        [{text: '🪨 Rock', callback_data: 'rock'}, {text: '📰 Paper', callback_data: 'paper'}, {
            text: '✂️ Scissors',
            callback_data: 'scissors'
        }],
    ];
    bot.sendMessage(chatId, 'Let\'s play Rock-Paper-Scissors! Please choose one of the options:', {
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});

function gameStarted(chatId) {
    return gameThread[chatId] === true;
}

function getRandomChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
}

async function determineWinner(chatId) {
    let result;

    if (playerChoice === botChoice) {
        result = 'It\'s a tie!';
    } else if (
        (playerChoice === 'rock' && botChoice === 'scissors') ||
        (playerChoice === 'paper' && botChoice === 'rock') ||
        (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
        result = 'You win!';
    } else {
        result = 'I win!';
    }

    await bot.sendMessage(chatId, `You chose ${playerChoice}, I chose ${botChoice}. ${result}`);
    if (result === 'You win!') {
        if (!await selectCoupon(chatId)) {
            if (!await selectCouponDaily()) {
                await insertCoupon(chatId);
                await bot.sendPhoto(chatId, "/home/elvis/IdeaProjects/erb_bot/supermarket.jpeg", {
                    caption: "Congratulation, Here is a coupon. Come again tomorrow to win again.",
                    parse_mode: "Markdown"
                })
            } else {
                await bot.sendMessage(chatId, "The daily coupon limit has been reached. Please check back tomorrow.")
            }
        } else {
            await bot.sendMessage(chatId, "You have already won a coupon. Please come back tomorrow.")
        }
    } else {
        await bot.sendMessage(chatId, "Would you like to try again ?\n/rps")
    }
    gameThread[chatId] = false;
}

async function insertCoupon(chatId) {
    const data = {
        chatId: chatId
    }
    try {
        const response = await axios.post('http://localhost:8888/coupon', data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function selectCoupon(chatId) {
    try {
        const response = await axios.get('http://localhost:8888/coupon/' + chatId);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function selectCouponDaily() {
    try {
        const response = await axios.get('http://localhost:8888/coupon/');
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function downloadPhoto(msg) {
    let chatId = msg.chat.id
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileName = `${fileId}.jpg`;
    const dirPath = 'photos';
    const filePath = path.join(dirPath, fileName);

    // Ensure the photos directory exists
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    // Get the file URL from Telegram
    const file = await bot.getFile(fileId);

    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    // Download the photo using axios
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    });

    // Save the photo to the file system
    const writeStream = fs.createWriteStream(filePath);
    response.data.pipe(writeStream);

    writeStream.on('finish', async () => {
            await processPhotoWithQuagga(filePath, chatId);
            await bot.sendPhoto(chatId, filePath);
            // Clean up the downloaded photo
            await fs.unlinkSync(filePath);
        }
    )
}

async function processPhotoWithQuagga(filePath, chatId, bot) {
    try {
        const result = await Quagga.decodeSingle({
            src: filePath,
            numOfWorkers: 0,
            inputStream: {
                size: 800
            },
            decoder: {
                readers: ["code_128_reader"]
            }
        });
        if (result && result.codeResult) {
            await bot.sendMessage(chatId, `Detected barcode: ${result.codeResult.code}`);
        } else {
            await bot.sendMessage(chatId, 'No barcode detected.');
        }
    } catch (e) {
        console.error(e);
        await bot.sendMessage(chatId, 'An error occurred while processing the photo.');
    }
}

//rock paper scissors end


//PROMOTION
const notifyMessage = "Would you like to enable notifications for the latest deals and promotions?";
const notifyOption = {
    inline_keyboard: [
        [{text: 'Enable', callback_data: 'notify_true'}, {text: 'Disable', callback_data: 'notify_false'}]
    ], resize_keyboard: true,
}

function askNotify(chatId) {
    bot.sendMessage(chatId, notifyMessage, {reply_markup: notifyOption});
}

async function updateCustomerNotify(chatId, notify) {
    const data = {
        chatId: chatId,
        notify: notify
    }
    try {
        const response = await axios.put('http://localhost:8888/customers/notify', data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function selectNotify() {
    try {
        const response = await axios.get('http://localhost:8888/customers/notify');
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function sendNotification() {
    let notify_customers = await selectNotify();
    let message = "Hello, we have a new coupon available.\nOnly 3 coupons a day, grab it before other does.\nBeat the bot with /rps to win it";

    const promises = notify_customers.map(async (customer) => {
        await bot.sendMessage(customer, message);
        await askNotify(customer);
    });

    await Promise.all(promises);
}

cron.schedule('30 15 * * *', () => {
    try {
        sendNotification().then(() => {
        });
    } catch (e) {
        console.log(e);
    }
});

const promotionWord = "phone";

async function checkPromotion(products) {
    try {
        return products.some(product => (
            product.productName.includes(promotionWord) ||
            product.description.includes(promotionWord)
        ));
    } catch (e) {
        console.log(e)
    }
}

async function sendPromotion(chatId) {
    try {
        const message = `
    🎉 *Special Promotion Alert!* 🎉
    
    Don't miss out on our latest and greatest offer!
    
    Take advantage of this limited-time deal on *${promotionWord.toUpperCase()}*.`

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '🔥 Check it out now 🔥',
                        url: 'https://www.youtube.com/watch?v=xvFZjo5PgG0&pp=ygUJcmljayByb2xs'
                    }]
                ]
            }
        });
    } catch (error) {
        console.error('Error sending promotion message:', error);
    }
}

//PROMOTION END


//STORE USER DATA
async function storeCustomerInfo(chatId, name) {
    const data = {
        chatId: chatId,
        name: name
    }
    axios.post('http://localhost:8888/customers', data, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(() => {
    }).catch((error) => {
        console.error(error);
    });
}

async function storeSearch(chatId, search) {
    const data = {
        chatId: chatId,
        search: search
    }
    try {
        const response = await axios.post('http://localhost:8888/customers/search', data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

async function storeCustomerUsage(chatId, command) {
    const data = {
        chatId: chatId,
        command: command
    }
    axios.post('http://localhost:8888/customers/usage', data, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(() => {
    }).catch((error) => {
        console.error(error);
    });
}

//STORE USER DATA END

//ALL CALLBACK FOR INLINE KEYBOARD
bot.on('callback_query', async (query) => {

    let chatId = query.message.chat.id;
    let name = query.message.chat.first_name;
    let messageId = query.message.message_id;
    if (advSearchThread[chatId] === true) {
        return
    }

    switch (query.data) {
        case 'search_by_keyword':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            advSearchThread[chatId] = true;
            bot.deleteMessage(chatId, messageId);
            storeCustomerUsage(chatId, "/advancesearch-keyword");

            bot.sendMessage(chatId, 'Please enter a keyword to search for:');
            bot.onText(/(.+)/, (msg, match) => {
                if (chatId === msg.chat.id) {
                    if (msg.text.startsWith('/')) {
                        bot.sendMessage(chatId, 'Please do not start your input with a forward slash (/).', {text: 'Please try again with a different input.'});
                        return;
                    }
                    const keyword = encodeURIComponent(match[1]);
                    try {
                        searchProductKeyword(chatId, keyword)
                        storeSearch(chatId, keyword);
                    } catch (e) {

                    } finally {
                        bot.removeTextListener(/(.+)/);
                    }
                } else {
                    bot.sendMessage(msg.chat.id, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                }
            })
            break;
        case 'search_by_price':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }
            advSearchThread[chatId] = true;

            bot.deleteMessage(chatId, messageId);
            storeCustomerUsage(chatId, "/advancesearch-price");

            bot.sendMessage(chatId, 'Please enter the price range (e.g., 10 500):');

            // Helper function to validate and parse the price range
            const parsePriceRange = (input) => {
                const parts = input.trim().split(/\s+/);
                if (parts.length !== 2) {
                    return null;
                }

                const minPrice = parseFloat(parts[0]);
                const maxPrice = parseFloat(parts[1]);

                if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0) {
                    return null;
                }

                return {minPrice, maxPrice};
            };

            bot.onText(/(.+)/, (msg) => {
                if (chatId === msg.chat.id) {
                    if (msg.text.startsWith('/')) {
                        bot.sendMessage(chatId, 'Please do not start your input with a forward slash (/).', {text: 'Please try again with a different input.'});
                        return;
                    }
                    const priceRange = parsePriceRange(msg.text);
                    if (priceRange) {
                        const {minPrice, maxPrice} = priceRange;
                        try {
                            advanceSearch(chatId, null, minPrice, maxPrice);
                            storeSearch(chatId, `${minPrice} - ${maxPrice}`);

                        } catch (e) {
                            console.error('Error in advanceSearch:', e);
                        } finally {
                            bot.removeTextListener(/(.+)/);
                        }
                    } else {
                        bot.sendMessage(chatId, 'Please enter a valid price range (e.g., 10 500) with positive values and the minimum price less than or equal to the maximum price.');
                    }
                } else {
                    bot.sendMessage(msg.chat.id, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                }
            });
            break;
        case 'search_by_both':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }
            advSearchThread[chatId] = true;

            try {
                bot.deleteMessage(chatId, messageId);
                storeCustomerUsage(chatId, "/advancesearch-both");

                bot.sendMessage(chatId, 'Please enter a keyword and price range (e.g., "stylish sofa 500 1000"):');

                // Helper function to validate and parse the keyword and price range
                const parseKeywordAndPriceRange = (input) => {
                    const parts = input.trim().split(/\s+/);
                    if (parts.length < 3) {
                        return null;
                    }

                    // Extract the keyword from the beginning of the input
                    const keyword = encodeURIComponent(parts.slice(0, -2).join(' '));

                    // Extract the price range from the last two words
                    const priceRange = parts.slice(-2);
                    const minPrice = parseFloat(priceRange[0]);
                    const maxPrice = parseFloat(priceRange[1]);
                    // Validate the price range
                    if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
                        return null;
                    }

                    return {
                        keyword,
                        minPrice,
                        maxPrice
                    };
                };

                bot.onText(/(.+)/, (msg) => {
                    if (chatId === msg.chat.id) {
                        if (parseKeywordAndPriceRange(msg.text) === null) {
                            bot.sendMessage(chatId, 'Please enter a valid keyword and price range (e.g., "stylish sofa 500 1000") with positive values and the minimum price less than or equal to the maximum price.');
                            return;
                        }
                        if (msg.text.startsWith('/')) {
                            bot.sendMessage(chatId, 'Please do not start your input with a forward slash (/).', {text: 'Please try again with a different input.'});
                            return;
                        }
                        const {keyword, minPrice, maxPrice} = parseKeywordAndPriceRange(msg.text);
                        if (keyword && minPrice && maxPrice) {
                            try {
                                advanceSearch(chatId, keyword, minPrice, maxPrice);
                                storeSearch(chatId, `${keyword} ${minPrice} - ${maxPrice}`);

                            } catch (e) {
                                console.error('Error in advanceSearch:', e);
                            } finally {
                                bot.removeTextListener(/(.+)/);
                            }
                        }
                    } else {
                        bot.sendMessage(msg.chat.id, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                    }
                });
            } catch (e) {
                console.error(e)
            }
            break;
        case '/help':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.sendMessage(chatId, helpMessage, helpOptions);
            await askNotify(chatId)
            break;
        case '/end':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }
            await end(chatId);
            break;
        case 'Electronics':
            await bot.deleteMessage(chatId, messageId);
            await searchProductCategory(chatId, "Electronics");
            storeCustomerUsage(chatId, "/category-Electronics");

            break;
        case 'Home Appliances':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.deleteMessage(chatId, messageId);
            await searchProductCategory(chatId, "Home Appliances");
            storeCustomerUsage(chatId, "/category-Home Appliances");
            break;
        case 'Furniture':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.deleteMessage(chatId, messageId);
            await searchProductCategory(chatId, "Furniture");
            storeCustomerUsage(chatId, "/category-Furniture");
            break;
        case 'Clothing':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.deleteMessage(chatId, messageId);
            await searchProductCategory(chatId, "Clothing");
            storeCustomerUsage(chatId, "/category-Clothing");
            break;
        case 'Sports & Outdoor':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.deleteMessage(chatId, messageId);
            await searchProductCategory(chatId, "Sports & Outdoor");
            storeCustomerUsage(chatId, "/category-Sports & Outdoor");
            break;
        case 'export':

            await bot.deleteMessage(chatId, messageId);
            const exportOptions = {
                inline_keyboard: [
                    [{text: 'Export as PDF', callback_data: 'export_pdf'}, {
                        text: 'Export as Excel',
                        callback_data: 'export_excel'
                    }]
                ]
            }
            await bot.sendMessage(chatId, "Please choose a file format:", {
                reply_markup: exportOptions
            });
            break;
        case 'export_pdf':
            // let dataforpdf = fetchData(chatId);
            await bot.deleteMessage(chatId, messageId);
            storeCustomerUsage(chatId, "/export_pdf");
            await exportToPDF(chatId);
            isMainMenu = true;
            // removeData(chatId);
            break;
        case 'export_excel':
            // let dataforword = fetchData(chatId);
            try {
                await bot.deleteMessage(chatId, messageId);
                storeCustomerUsage(chatId, "/export_excel");
                await exportToExcel(chatId);
            } catch (e) {
                console.log(e)
            }
            isMainMenu = true;

            // removeData(chatId);
            break;
        case 'very_satisfied':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            satisfaction = 'very_satisfied';
            await bot.deleteMessage(chatId, messageId);
            await bot.sendMessage(chatId, `Thank you for your feedback. Your satisfaction level is noted as "${satisfaction}".`);
            satisfaction = 5;

            await comment(chatId);
            break;
        case 'satisfied':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            satisfaction = 'satisfied';
            await bot.deleteMessage(chatId, messageId);
            await bot.sendMessage(chatId, `Thank you for your feedback. Your satisfaction level is noted as "${satisfaction}".`);
            satisfaction = 4;

            await comment(chatId);
            break;
        case 'neutral':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            satisfaction = 'neutral';
            await bot.deleteMessage(chatId, messageId);
            await bot.sendMessage(chatId, `Thank you for your feedback. Your satisfaction level is noted as "${satisfaction}".`);
            satisfaction = 3;
            await comment(chatId);
            break;
        case 'dissatisfied':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            satisfaction = 'dissatisfied';
            await bot.deleteMessage(chatId, messageId);
            await bot.sendMessage(chatId, `Thank you for your feedback. Your satisfaction level is noted as "${satisfaction}".`);
            satisfaction = 2;
            await comment(chatId);
            break;
        case 'very_dissatisfied':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            satisfaction = 'very_dissatisfied';
            await bot.deleteMessage(chatId, messageId);
            await bot.sendMessage(chatId, `Thank you for your feedback. Your satisfaction level is noted as "${satisfaction}".`);
            satisfaction = 1;
            await comment(chatId);
            break;
        case 'leave_comment':
            isMainMenu = false
            commentThread[chatId] = true;
            await bot.deleteMessage(chatId, messageId);
            try {
                bot.sendMessage(chatId, 'Please enter your comment:');
                bot.onText(/(.+)/, async (msg) => {
                    if (chatId === msg.chat.id) {
                        const comments = msg.text;
                        if (comments.startsWith('/')) {
                            await bot.sendMessage(chatId, 'Please do not start your input with a forward slash (/).', {text: 'Please try again with a different input.'});
                            return;
                        }
                        if (comments.length > 50) {
                            await bot.sendMessage(chatId, 'Your comment cannot exceed 50 characters. Please try again with a shorter comment.');
                            return;
                        }

                        await bot.sendMessage(chatId, 'Thank you for your comment.');
                        await insertComment(chatId, name, satisfaction, comments);

                        bot.removeTextListener(/(.+)/);
                        bot.sendMessage(chatId, "Hope to see you again soon 🙇🏻 ");
                        isMainMenu = true;
                        commentThread[chatId] = false

                    } else {
                        bot.sendMessage(msg.chat.id, 'Sorry, I didn\'t understand that command. Please check help for commands.', helpOptions);
                    }
                })

            } catch (err) {
                console.log(err)
            }

            break;
        case 'skip_comment':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            try {
                let comments = "";
                await bot.deleteMessage(chatId, messageId);
                await bot.sendMessage(chatId, "Hope to see you again soon 🙇🏻 ");
                await insertComment(chatId, name, satisfaction, comments);

            } catch (e) {
                console.log(e);
            }
            isMainMenu = true;

            break
        case 'notify_true':
            await bot.deleteMessage(chatId, messageId);
            try {
                updateCustomerNotify(chatId, true);
            } catch (e) {
                console.log(e)
            }
            bot.sendMessage(chatId, 'You have enabled notifications for the latest deals and promotions.');
            break;
        case 'notify_false':
            await bot.deleteMessage(chatId, messageId);
            try {
                updateCustomerNotify(chatId, false);
            } catch (e) {
                console.log(e)
            }
            bot.sendMessage(chatId, 'You have disabled notifications for the latest deals and promotions.');
            break;
        case 'rock':
        case 'paper':
        case 'scissors':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            bot.deleteMessage(chatId, messageId);
            playerChoice = query.data;
            botChoice = getRandomChoice();
            determineWinner(chatId);
            break;
        case 'New Territories':
        case 'Kowloon':
        case 'Hong Kong Island':
            if (advSearchThread[chatId] === true || commentThread[chatId] === true) {
                return
            }

            await bot.deleteMessage(chatId, messageId);
            searchByDistrict(chatId, query.data);
            await storeCustomerUsage(chatId, "/shop-" + query.data);
            break;
        default:
            await bot.sendMessage(chatId, 'Invalid option selected.');
            isMainMenu = true;
    }
});
