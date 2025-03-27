import { Client as IClient } from '@gradio/client';
import { IPromptModule } from './Prompt';
const { Client } = require("@gradio/client") as typeof import('@gradio/client');
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



interface HugSpacesChatInit { 
    modelName?: string
    apiKey?: string
}

export type SpacesModel = keyof typeof HugSpacesChat.modelSpaces

class MissingSpaceAPIKeyException extends Error { 
    constructor() { 
        super("No API key provided for restricted Space!")
    }
}

const restrictedSpaces: Record<string, { 
    name: string
    init(api_key: string, model: string): Record<string, any>
} | undefined> = { 
    "playmak3r/openrouter-proxy": { 
        name: "playmak3r/openrouter-proxy",
        init(api_key: string, model: string) { 
            return { 
                model,
                api_key,
                stream: false,
            }
        }
    }
}

const openrouter_space = "playmak3r/openrouter-proxy"

class HugSpacesChat { 
    public static modelSpaces = { 
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
    public static restrictedSpaces = restrictedSpaces
    public static isRestricted(model: string): boolean { 
        return HugSpacesChat.modelSpaces[model as SpacesModel] in HugSpacesChat.restrictedSpaces
    }
    public getRequestBody(model: string, apiKey?: string) { 
        const space = HugSpacesChat.restrictedSpaces[HugSpacesChat.modelSpaces[model as SpacesModel]]
        return space?.init(apiKey as string, model)
    }
    private modelName?: string
    private apiKey?: string
    private clientReq?: Promise<IClient | null>
    constructor({ modelName, apiKey }: HugSpacesChatInit = {}) { 
        if (apiKey) { this.apiKey = apiKey }
        if (modelName) { 
            this.modelName = modelName 
            this.connect(modelName)
        }
    }

    setApiKey(key: string) { this.apiKey = key }

    connect(modelName?: string) { 
        modelName = modelName ?? this.modelName
        if (!modelName) { return }
        else if (!(modelName in HugSpacesChat.modelSpaces)) { alert('Invalid model!') }
        else if (HugSpacesChat.isRestricted(modelName) && !this.apiKey) { 
            throw new MissingSpaceAPIKeyException()
        }
        else if (modelName !== this.modelName || !this.clientReq) { 
            if (modelName !== this.modelName) { this.modelName = modelName }
            this.clientReq = Client.connect(HugSpacesChat.modelSpaces[modelName as SpacesModel])
            .catch(() => null)
        }
    }

    async sendPrompt(texts: string[], target_language: string = "English - US") { 
        const client = await this.clientReq
        if (client) { 
            const response = await client.predict("/chat", { 		
                message: userPrompt(texts), 
                ...this.getRequestBody(this.modelName as string, this.apiKey),
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