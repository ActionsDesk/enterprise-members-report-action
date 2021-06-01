"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const reporter_1 = require("./reporter");
console.log("Example 2");
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Example 3");
    const actionParams = {
        enterprise: 'droidpl',
        token: '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',
        emails: [],
        sender: 'droidpl@github.com',
        subject: 'Test',
        smtp_host: 'smtp.gmail.com',
        smtp_port: '25',
    };
    yield reporter_1.generateReport(actionParams);
}))();
//# sourceMappingURL=local.js.map