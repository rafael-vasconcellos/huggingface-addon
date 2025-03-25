import { Client as IClient } from '@gradio/client';
import { IPromptModule } from './Prompt';
const { Client } = require("@gradio/client") as typeof import('@gradio/client');
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



interface HugSpacesChatInit { 
    modelName?: string
    apiKey?: string
}

export type SpacesModels = keyof typeof HugSpacesChat.spacesModels

class MissingSpaceAPIKeyException extends Error { 
    constructor() { 
        super("No API key provided for restricted Space!")
    }
}

class HugSpacesChat { 
    public static spacesModels = { 
        //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
        //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
        //"llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
        //"llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
        "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
        "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
        "Command-R+": "Nymbo/c4ai-command-r-plus",
    }
    public static restrictedSpaces = new Set<string>()
    public static isRestricted(model: string) { 
        return HugSpacesChat.restrictedSpaces.has( HugSpacesChat.spacesModels[model as SpacesModels] )
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
        else if (!HugSpacesChat.spacesModels[modelName as never]) { alert('Invalid model!') }
        else if (modelName !== this.modelName || !this.clientReq) { 
            if (modelName !== this.modelName) { this.modelName = modelName }
            this.clientReq = Client.connect(HugSpacesChat.spacesModels[modelName as SpacesModels])
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


const spaces_module = { HugSpacesChat, MissingSpaceAPIKeyException }
export type SpacesModule = typeof spaces_module
module.exports = spaces_module

/* const endpoints = { 
    "llama-3.1-405b": "/chat",
    "llama-3.1-70b": "/chat",
    "llama-3.1-405b-fp8": "/chat"
} */