import { Client as IClient } from '@gradio/client';
import { IPromptModule } from './Prompt';
const { Client } = require("@gradio/client") as typeof import('@gradio/client');
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



interface HugSpacesChatInit { 
    modelName?: string
    apiKey?: string
}

export type SpacesModel = keyof typeof HugSpacesChat.spacesModels

class MissingSpaceAPIKeyException extends Error { 
    constructor() { 
        super("No API key provided for restricted Space!")
    }
}

const openrouter_space = "playmak3r/openrouter-proxy"

class HugSpacesChat { 
    public static spacesModels = { 
        //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
        //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
        //"llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
        //"llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
        "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
        "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
        "Command-R+": "Nymbo/c4ai-command-r-plus",

        "cohere/command-r-plus-08-2024": openrouter_space,
        "qwen/qwq-32b:free": openrouter_space,
        "qwen/qwen-2.5-72b-instruct:free": openrouter_space,
        "deepseek/deepseek-r1:free": openrouter_space,
        "deepseek/deepseek-chat:free": openrouter_space,
        "deepseek/deepseek-chat-v3-0324:free": openrouter_space,
        "openai/gpt-4o": openrouter_space,
        "google/gemma-3-27b-it:free": openrouter_space,
        "google/gemini-2.0-flash-exp:free": openrouter_space,
        "google/gemini-2.0-pro-exp-02-05:free": openrouter_space,
    }
    public static restrictedSpaces = new Set<string>([ openrouter_space ])
    public static isRestricted(model: string) { 
        return HugSpacesChat.restrictedSpaces.has( HugSpacesChat.spacesModels[model as SpacesModel] )
    }
    private modelName?: string
    private apiKey?: string
    private clientReq?: Promise<IClient | null>
    constructor({ modelName, apiKey }: HugSpacesChatInit = {}) { 
        if (modelName) { 
            this.modelName = modelName 
            this.connect(modelName)
        }
        if (apiKey) { this.apiKey = apiKey }
    }

    setApiKey(key: string) { this.apiKey = key }

    connect(modelName?: string) { 
        modelName = modelName ?? this.modelName
        if (!modelName) { return }
        else if (!HugSpacesChat.spacesModels[modelName as SpacesModel]) { alert('Invalid model!') }
        else if (HugSpacesChat.isRestricted(modelName) && !this.apiKey) { 
            throw new MissingSpaceAPIKeyException()
        }
        else if (modelName !== this.modelName || !this.clientReq) { 
            if (modelName !== this.modelName) { this.modelName = modelName }
            this.clientReq = Client.connect(HugSpacesChat.spacesModels[modelName as SpacesModel])
            .catch(() => null)
        }
    }

    async sendPrompt(texts: string[], target_language: string = "English - US") { 
        const client = await this.clientReq
        if (client) { 
            const response = await client.predict("/chat", { 		
                message: userPrompt(texts), 
                model: this.modelName,
                api_key: this.apiKey,
                stream: false,
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


const spaces_module = { HugSpacesChat, MissingSpaceAPIKeyException }
export type SpacesModule = typeof spaces_module
module.exports = spaces_module

/* 
    const endpoints = { 
        "llama-3.1-405b": "/chat",
        "llama-3.1-70b": "/chat",
        "llama-3.1-405b-fp8": "/chat"
    }

    "cohere/command-r-plus-08-2024"
    "qwen/qwq-32b:free"
    "qwen/qwen-2.5-72b-instruct:free"
    "deepseek/deepseek-r1:free"
    "deepseek/deepseek-chat:free"
    "deepseek/deepseek-chat-v3-0324:free"
    "openai/gpt-4o"
    "google/gemma-3-27b-it:free"
    "google/gemini-2.0-flash-exp:free"
    "google/gemini-2.0-pro-exp-02-05:free"
*/