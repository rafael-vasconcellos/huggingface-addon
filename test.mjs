import { Client } from "@gradio/client";


const models = { 
    //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
    //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
    "llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
    "llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
    "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
    "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
    "Command-R+": "Nymbo/c4ai-command-r-plus",
}

export class HugSpacesChat { 
    constructor(model_name) { 
        if (model_name) { 
            this.model_name = model_name 
            this.connect(model_name)
        }
    }

    connect(model_name) { 
        model_name = model_name ?? this.model_name
        if (!model_name) { return null }
        else if (!models[model_name]) { return alert('Invalid model!') }
        this.clientReq = Client.connect(models[model_name])
        .catch(() => null)
    }

    async sendPrompt(text) { 
        const client = await this.clientReq
        if (client) { 
            return await client.predict("/chat", { 		
                message: userPrompt(text), 
                system_message: systemPrompt, 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
        }
    }

    async testPrompt(text) { 
        const client = await this.clientReq
        if (client) { 
            return await client.predict("/chat", { 		
                message: text, 
                //system_message: systemPrompt, 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
        }
    }

}


const hugSpacesChat = new HugSpacesChat("Command-R-Plus-08-2024")
hugSpacesChat.testPrompt("Good evening.").then(response => { 
    console.log(response?.data)
})