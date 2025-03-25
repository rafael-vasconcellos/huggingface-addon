import { ICustomEngineModule } from './Custom';
import { IPromptModule } from './Prompt';
import { SpacesModule, SpacesModels } from './hugging-spaces';
import { HuggingFaceInferenceModule, InferenceModels } from './hf-inference';
const { CustomEngine, TranslationFailException } = require("./Custom") as ICustomEngineModule;
const { parseResponse } = require("./Prompt") as IPromptModule;
const { HugSpacesChat, MissingSpaceAPIKeyException } = require("./hugging-spaces") as SpacesModule;
const { InferenceClient, MissingInferenceAPIKeyException } = require('./hf-inference') as HuggingFaceInferenceModule



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
        if (HugSpacesChat.spacesModels[model as SpacesModels]) { 
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
    get model_name(): string { return this.getEngine()?.getOptions('model_name') ?? "Command-R-Plus-08-2024" }
    get api_key(): string { return this.getEngine()?.getOptions('api_key') ?? "Placeholder" }
    get spaces_key(): string { return this.getEngine()?.getOptions('spaces_key') }

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
                        enum: [...Object.keys(HugSpacesChat.spacesModels), ...Object.keys(InferenceClient.inferenceModels)]
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
                        key: "target_language"
                    }, 
                ],
                onChange: (_: HTMLInputElement, key: string, value: any) => { 
                    this.update(key, value);
                    if (key === "model_name" && InferenceClient.inferenceModels[value as InferenceModels] && !this.api_key) { 
                        alert("This model requires an Inference API key!")
                    }
                    if (key === "model_name" && HugSpacesChat.isRestricted(value) && !this.spaces_key) { 
                        alert("This model requires a Space API key!")
                    }
                }
            }

        })
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


}


const EngineModule = { EngineClient }
export type IEngineModule = typeof EngineModule
module.exports = EngineModule