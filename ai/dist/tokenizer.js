"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessNumberOfTokens = void 0;
const guessNumberOfTokens = (text) => {
    // based on https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
    // 1 token = 4 characters, 100 tokens = 75 words
    return text.split(" ").length * 1.33;
};
exports.guessNumberOfTokens = guessNumberOfTokens;
