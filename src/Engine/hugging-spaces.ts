import { Client as IClient } from '@gradio/client';
import { IPromptModule } from './Prompt';
const { Client } = require("@gradio/client") as typeof import('@gradio/client');
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



class HugSpacesChat { 
    public readonly spacesModels = { 
        //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
        //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
        "llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
        "llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
        "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
        "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
        "Command-R+": "Nymbo/c4ai-command-r-plus",
    }
    private model_name?: string
    private clientReq?: Promise<IClient | null>
    constructor(model_name?: string) { 
        if (model_name) { 
            this.model_name = model_name 
            this.connect(model_name)
        }
    }

    connect(model_name?: string) { 
        model_name = model_name ?? this.model_name
        if (!model_name) { return null }
        else if (!this.spacesModels[model_name as never]) { alert('Invalid model!') }
        else if (model_name !== this.model_name || !this.clientReq) { 
            if (model_name !== this.model_name) { this.model_name = model_name }
            this.clientReq = Client.connect(this.spacesModels[model_name as never])
            .catch(() => null)
        }
    }

    async sendPrompt(texts: string[], target_language: string = "English - US") { 
        const client = await this.clientReq
        if (client) { 
            const response = await client.predict("/chat", { 		
                message: userPrompt(texts), 
                system_message: systemPrompt(target_language), 
                //max_tokens: 1, 
                temperature: 0,
                top_p: 0.1, 
            });
            return response?.data?.[0 as never] ?? JSON.stringify(response)
        }

        return ""
    }

    async testPrompt(text: string, _: string) { 
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


const spaces_module = { HugSpacesChat }
export type SpacesModule = typeof spaces_module
module.exports = spaces_module

/* const endpoints = { 
    "llama-3.1-405b": "/chat",
    "llama-3.1-70b": "/chat",
    "llama-3.1-405b-fp8": "/chat"
} */