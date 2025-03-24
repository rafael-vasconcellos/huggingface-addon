import { ICustomEngineModule } from './Custom';
import { IPromptModule } from './Prompt';
import { SpacesModule } from './hugging-spaces'
const { CustomEngine, TranslationFailException } = require("./Custom") as ICustomEngineModule;
const { parseResponse } = require("./Prompt") as IPromptModule;
const { HugSpacesChat } = require("./hugging-spaces") as SpacesModule;


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
                        enum: ["Command-R-Plus-08-2024", "Command-R+", "Qwen-2.5-72B-Instruct"]
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
        const response = await this.hugSpacesChat.sendPrompt(texts, this.target_language)
        .catch(e => { 
            throw new TranslationFailException({
                message: "Error while fetching.",
                status: 529
            })
        })
        const result = await parseResponse(response) 
        if (result.length!==texts.length) { 
            const message = result.length === 0? 
				"Failed to parse: " + response 
				: `Unexpected error: length ${result.length} out of ${texts.length}.` + '\n\n' + response;
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