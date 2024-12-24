import { Client as IClient } from '@gradio/client';
import { ICustomEngineModule } from './custom';
import { IPromptModule } from './Prompt';
const { Client } = require("www/addons/c4ai/lib/@gradio/client") as typeof import('@gradio/client');
const { CustomEngine, TranslationFailException } = require("www/addons/c4ai/Engine/custom.js") as ICustomEngineModule;
const { systemPrompt, userPrompt, parseResponse } = require("www/addons/c4ai/Engine/Prompt.js") as IPromptModule;


const models = { 
    //"llama-3.1-405b": "aifeifei798/Meta-Llama-3.1-405B-Instruct",
    //"llama-3.1-70b": "aifeifei798/llama-3.1-70b-instruct",
    "llama-3.1-405b": "Nymbo/Llama-3.1-405B-Instruct",
    "llama-3.1-405b-fp8": "as-cle-bert/Llama-3.1-405B-FP8",
    "Qwen-2.5-72B-Instruct": "Nymbo/Qwen-2.5-72B-Instruct",
    "Command-R-Plus-08-2024": "Nymbo/Command-R-Plus-08-2024",
    "Command-R+": "Nymbo/c4ai-command-r-plus",
}

/* const endpoints = { 
    "llama-3.1-405b": "/chat",
    "llama-3.1-70b": "/chat",
    "llama-3.1-405b-fp8": "/chat"
} */



interface IHugSpacesChat { 
    model_name?: string
    sendPrompt(text: string[]): Promise<unknown>
    connect(model_name?: string): void
}

class HugSpacesChat implements IHugSpacesChat { 
    private clientReq?: Promise<IClient | null>
    readonly model_name?: string

    constructor(model_name?: string) { 
        if (model_name) { 
            this.model_name = model_name 
            this.connect(model_name)
        }
    }

    connect(model_name?: string) { 
        model_name = model_name ?? this.model_name
        if (!model_name) { return null }
        else if (!models[model_name as never]) { return alert('Invalid model!') }
        this.clientReq = Client.connect(models[model_name as never])
        .catch(() => null)
    }

    async sendPrompt(text: string[]) { 
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

    async testPrompt(text: string) { 
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


class EngineClient extends CustomEngine { 
    get model_name(): string { return this.getEngine()?.getOptions('model_name') ?? "Command-R-Plus-08-2024" }
    get api_key(): string | null { return "Placeholder" }
    private hugSpacesChat = new HugSpacesChat()

    constructor(thisAddon: Addon) { 
        trans.config.maxRequestLength = 25
        super({ 
            id: thisAddon.package.name,
            name: thisAddon.package.title,
            description: thisAddon.package.description,
            version: thisAddon.package.version,
            author: thisAddon.package.author?.name ?? thisAddon.package.author as unknown,
            maxRequestLength: trans.config.maxRequestLength,
            batchDelay: 1, // 0 is a falsy value, it'll be reverted to the default value (5000)
            optionsForm: { 
                schema: { 
                    target_language: { 
                        type: "string",
                        title: "Target language",
                        description: "Choose the target language",
                        default: "English - US",
                        required: false
                    },
                    model_name: { 
                        type: "string",
                        title: "Model name",
                        description: "Choose the model",
                        required: false,
                        default: "Command-R-Plus-08-2024",
                        enum: ["Command-R-Plus-08-2024", "Command-R+", ]
                    }
                },

                form: [ 
                    /* { 
                        key: "api_key",
                        onChange: (evt: Event & { target: HTMLInputElement }) => { 
                            if (evt.target?.value) { this.api_key = evt.target.value }
                        }
                    }, { 
                        key: "api_type"
                    }, */ { 
                        key: "model_name"
                    }, { 
                        key: "target_language"
                    }, 
                ],
                onChange: (elm: HTMLInputElement, key: string, value: unknown) => { this.update(key, value); }
            }

        })
    }

    public async fetcher(texts: string[]) { 
        this.hugSpacesChat.connect(this.model_name)
        const response_data = (await this.hugSpacesChat.sendPrompt(texts)
        .catch(e => { throw new TranslationFailException({
                message: "Error while fetching.",
                status: 529
        })}))?.data
        const response = response_data?.[0 as never] ?? JSON.stringify(response_data)
        const result = await parseResponse(response) 
        if (result.length!==texts.length) { 
            const message = result.length===0? "Failed to parse: " + response_data : 'Unexpected error!'
            throw new TranslationFailException({
                message,
                status: 200
            }) 
        }

        return result
    }


}


const EngineModule = { EngineClient }
export type IEngineModule = typeof EngineModule
module.exports = EngineModule