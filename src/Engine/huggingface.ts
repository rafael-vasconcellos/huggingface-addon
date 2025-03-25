import { ICustomEngineModule } from './Custom';
import { IPromptModule } from './Prompt';
import { SpacesModule, SpacesModels } from './hugging-spaces';
import { HuggingFaceInferenceModule } from './hf-inference';
const { CustomEngine, TranslationFailException } = require("./Custom") as ICustomEngineModule;
const { parseResponse } = require("./Prompt") as IPromptModule;
const { HugSpacesChat } = require("./hugging-spaces") as SpacesModule;
const { InferenceClient } = require('./hf-inference') as HuggingFaceInferenceModule



class HuggingFaceClient { 
    private inferenceClient: InstanceType<typeof InferenceClient>
    private hugSpacesChat = new HugSpacesChat()
    constructor(private api_key: string) { 
        this.inferenceClient = new InferenceClient(api_key)
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

class EngineClient extends CustomEngine { 
    get model_name(): string { return this.getEngine()?.getOptions('model_name') ?? "Command-R-Plus-08-2024" }
    get api_key(): string { return "Placeholder" }

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
                        enum: Object.keys(HugSpacesChat.spacesModels)
                    },
                    api_key: { 
                        type: "string",
                        title: "API Key",
                        description: "Insert your HugginFace key to use HuggingFace Inference (Note: Inference ≠ Spaces)",
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
                        key: "api_key",
                        /* onChange: (evt: Event & { target: HTMLInputElement }) => { 
                            if (evt.target?.value) { this.api_key = evt.target.value }
                        } */
                    }, { 
                        key: "model_name"
                    }, { 
                        key: "target_language"
                    }, 
                ],
                onChange: (_: HTMLInputElement, key: string, value: unknown) => { 
                    if (key === "api_key") { 
                        const spacesModels = Object.keys(HugSpacesChat.spacesModels)
                        const inferenceModels = Object.keys(InferenceClient.inferenceModels)
                        if (value) {}
                    }
                    this.update(key, value);
                }
            }

        })
    }

    public async fetcher(texts: string[], model: string = this.model_name) { 
        const client = new HuggingFaceClient(this.api_key)
        return await client.generate(texts, model, this.target_language)
    }


}


const EngineModule = { EngineClient }
export type IEngineModule = typeof EngineModule
module.exports = EngineModule