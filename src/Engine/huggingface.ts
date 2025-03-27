import { ICustomEngineModule } from './Custom';
import { IPromptModule } from './Prompt';
import { SpacesModule } from './hugging-spaces';
import { HuggingFaceInferenceModule, InferenceModel } from './hf-inference';
import { RowsModule } from '../submenus/rows';
const { CustomEngine, TranslationFailException } = require("./Custom") as ICustomEngineModule;
const { parseResponse } = require("./Prompt") as IPromptModule;
const { HugSpacesChat, MissingSpaceAPIKeyException } = require("./hugging-spaces") as SpacesModule;
const { InferenceClient, MissingInferenceAPIKeyException } = require('./hf-inference') as HuggingFaceInferenceModule;
const { createSubmenu } = require("../submenus/rows") as RowsModule;



interface HuggingFaceClientInit { 
    inference_key: string
    spaces_key?: string
}

class HuggingFaceClient { 
    private inferenceClient: InstanceType<typeof InferenceClient>
    private hugSpacesChat: InstanceType<typeof HugSpacesChat>
    constructor({ inference_key, spaces_key }: HuggingFaceClientInit) { 
        this.inferenceClient = new InferenceClient(inference_key)
        this.hugSpacesChat = new HugSpacesChat({ apiKey: spaces_key })
    }

    private async sendPrompt(texts: string[], model: string, target_language: string) { 
        if (model in HugSpacesChat.modelSpaces) { 
            this.hugSpacesChat.connect(model)
            return this.hugSpacesChat.sendPrompt(texts, target_language)

        } else { 
            return this.inferenceClient.sendPrompt({ 
                texts,
                model,
                target_language,
            })
        }
    }

    public async generate(texts: string[], model: string, target_language: string = "English - US") { 
        const response = await this.sendPrompt(texts, model, target_language)
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

class EngineClient extends CustomEngine { 
    public static models = [...Object.keys(HugSpacesChat.modelSpaces), ...Object.keys(InferenceClient.inferenceModels)]
    public readonly package_name: string
    public readonly package_title: string
    get model_name(): string { return this.getEngine()?.getOptions('model_name') || "Command-R-Plus-08-2024" }
    get api_key(): string { return this.getEngine()?.getOptions('api_key') || "Placeholder" }
    get spaces_key(): string { return this.getEngine()?.getOptions('spaces_key') || '' }
    get rows_translation_models(): string { return this.getEngine()?.getOptions('rows_translation_models') || 'google/gemini-2.0-flash-exp:free,qwen/qwen-2.5-72b-instruct:free,deepseek/deepseek-chat-v3-0324:free,openai/gpt-4o' }

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
                    model_name: { 
                        type: "string",
                        title: "Model name",
                        description: "Choose the model",
                        required: false,
                        default: "Command-R-Plus-08-2024",
                        enum: EngineClient.models
                    },
                    api_key: { 
                        type: "string",
                        title: "API key",
                        description: "Insert your HugginFace key to use HuggingFace Inference (Note: Inference ≠ Spaces)",
                        required: false
                    },
                    spaces_key: { 
                        type: "string",
                        title: "Spaces API key",
                        description: "Use this field if and only IF a space requires an API key.",
                        required: false
                    },
                    rows_translation_models: { 
                        type: "string",
                        title: "Models for rows translation",
                        description: "Type the name of the models to use for translating entire selected rows. format: model1,model2,etc. (order matters)",
                        required: false,
                        default: 'google/gemini-2.0-flash-exp:free,qwen/qwen-2.5-72b-instruct:free,deepseek/deepseek-chat-v3-0324:free,openai/gpt-4o'
                    },
                    target_language: { 
                        type: "string",
                        title: "Target language",
                        description: "Choose the target language",
                        default: "English - US",
                        required: false
                    },
                },

                form: [ 
                    { 
                        key: "model_name"
                    }, { 
                        key: "api_key",
                        /* onChange: (evt: Event & { target: HTMLInputElement }) => { 
                            if (evt.target?.value) { this.api_key = evt.target.value }
                        } */
                    }, { 
                        key: "spaces_key"
                    }, { 
                        key: "rows_translation_models"
                    }, { 
                        key: "target_language"
                    }, 
                ],
                onChange: (_: HTMLInputElement, key: string, value: any) => { 
                    this.update(key, typeof value === "string"? value : "") 
                    if (key === "rows_translation_models") { this.setRowsTranslationContextMenu() }
                    if (key === "model_name" && InferenceClient.inferenceModels[value as InferenceModel] && !this.api_key) { 
                        alert("This model requires an Inference API key!")
                    }
                    else if (key === "model_name" && HugSpacesChat.isRestricted(value) && !this.spaces_key) { 
                        alert("This model requires a Space API key!")
                    }
                }
            }

        })
        this.package_name = thisAddon.package.name
        this.package_title = thisAddon.package.title
        this.setRowsTranslationContextMenu()
    }

    public async fetcher(texts: string[], model: string = this.model_name) { 
        const client = new HuggingFaceClient({ 
            inference_key: this.api_key,
            spaces_key: this.spaces_key
        })
        return await client.generate(texts, model, this.target_language)
        .catch(e => { 
            if (e instanceof MissingInferenceAPIKeyException || e instanceof MissingSpaceAPIKeyException) { 
                this.abort()
                throw new TranslationFailException({ 
                    message: e.message,
                    status: 400
                })
            }
            throw new TranslationFailException({
                message: "Error while fetching.",
                status: 529
            })
        })
    }

    setRowsTranslationContextMenu() { 
        if (!this.package_name || !this.package_title || !this.rows_translation_models) { return }
        trans.gridContextMenu[this.package_name] = createSubmenu({ 
            rowModels: this.rows_translation_models.split(','),
            package_name: this.package_name,
            package_title: this.package_title,
            models: EngineClient.models
        })
    }


}


const EngineModule = { EngineClient }
export type IEngineModule = typeof EngineModule
module.exports = EngineModule