import { IPromptModule } from './Prompt';
const { HfInference } = require('@huggingface/inference') as typeof import('@huggingface/inference')
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



type InferenceProvider = "fireworks-ai" | "together" | "novita" | "nebius" | "hyperbolic" | "sambanova" | "hf-inference"

interface PromptOptions { 
    texts: string[], 
    model: string, 
    target_language?: string,
    provider?: string
}

export type InferenceModels = keyof typeof InferenceClient.inferenceModels

class InferenceClient extends HfInference { 
    public static inferenceModels = { 
        "deepseek-ai/DeepSeek-R1": "fireworks-ai" as InferenceProvider,
        "deepseek-ai/DeepSeek-V3": "fireworks-ai" as InferenceProvider,
        "meta-llama/Llama-3.3-70B-Instruct": "fireworks-ai" as InferenceProvider,
        "google/gemma-3-27b-it": "hf-inference" as InferenceProvider,
        "Qwen/Qwen2.5-72B-Instruct": "hf-inference" as InferenceProvider,
        "Qwen/QwQ-32B": "hf-inference" as InferenceProvider,
    }
    constructor(key: string) { 
        super(key)
    }

    async sendPrompt({ texts, model, target_language, provider }: PromptOptions) { 
        target_language ||= "English - US"
        const response = await this.chatCompletion({ 
            model,
            provider: provider ?? InferenceClient.inferenceModels[model as InferenceModels],
            messages: [ 
                { role: "system", content: systemPrompt(target_language) },
                { role: "user", content: userPrompt(texts) }
            ],
            temperature: 0,
            max_tokens: 1024,
            top_p: 0.3
        } )

        return response?.choices?.[0]?.message?.content ?? ""
    }

}


const inference_module = { InferenceClient }
export type HuggingFaceInferenceModule = typeof inference_module
module.exports = inference_module