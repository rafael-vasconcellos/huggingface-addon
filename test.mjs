import { Client } from "@gradio/client";
import pkg from "./dist/c4ai/Engine/Prompt.js";
const { systemPrompt, userPrompt } = pkg


const models = { 
    //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
    //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
    "llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
    "llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
    "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
    "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
    "Command-R+": "Nymbo/c4ai-command-r-plus",
}

class HugSpacesChat { 
    constructor(model_name) { 
        if (model_name) { 
            this.model_name = model_name 
            this.connect(model_name)
        }
    }

    connect(model_name) { 
        model_name = model_name ?? this.model_name
        if (!model_name) { return null }
        else if (!models[model_name]) { alert('Invalid model!') }
        else if (model_name !== this.model_name || !this.clientReq) { 
            if (model_name !== this.model_name) { this.model_name = model_name }
            this.clientReq = Client.connect(models[model_name])
            .catch(() => null)
        }
    }

    async sendPrompt(text, target_language) { 
        const client = await this.clientReq
        if (client) { 
            return await client.predict("/chat", { 		
                message: userPrompt(text), 
                system_message: systemPrompt(target_language), 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
        }
    }

    async testPrompt(text, _) { 
        const client = await this.clientReq
        if (client) { 
            return await client.predict("/chat", { 		
                message: text, 
                system_message: "Be as fast as possible.", 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
        }
    }

}


const testPrompt = []

const hugSpacesChat = new HugSpacesChat("Command-R-Plus-08-2024")
hugSpacesChat.testPrompt("Good Evening.", "English - US").then(response => { 
    console.log(response?.data)
}).catch( e => console.log(JSON.stringify(e)) )

