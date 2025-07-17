import { IPromptModule } from './Prompt';
const { HfInference } = require('@huggingface/inference') as typeof import('@huggingface/inference')
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



type InferenceProvider = "fireworks-ai" | "hyperbolic" | "together" | "novita" | "nebius" | "sambanova" | "hf-inference" | "featherless-ai"

interface PromptOptions { 
    texts: string[], 
    model: string, 
    target_language?: string,
    provider?: string
}

export type InferenceModel = keyof typeof InferenceClient.InferenceModels

class MissingInferenceAPIKeyException extends Error { 
    constructor() { 
        super("No API key provided for Inference!")
    }
}

class InferenceClient extends HfInference { 
    public static InferenceModels = { 
        "deepseek-ai/DeepSeek-V3": "fireworks-ai" as InferenceProvider,
        "deepseek-ai/DeepSeek-V3-0324": "fireworks-ai" as InferenceProvider,
        "deepseek-ai/DeepSeek-R1": "fireworks-ai" as InferenceProvider,
        "deepseek-ai/DeepSeek-R1-0528": "fireworks-ai" as InferenceProvider,
        "Qwen/Qwen3-235B-A22B": "fireworks-ai" as InferenceProvider,
        "Qwen/Qwen2.5-72B-Instruct": "hf-inference" as InferenceProvider,
        "Qwen/QwQ-32B": "hf-inference" as InferenceProvider,
        "moonshotai/Kimi-K2-Instruct": "groq" as InferenceProvider,
        "shisa-ai/shisa-v2-llama3.3-70b": "featherless-ai" as InferenceProvider,
        "meta-llama/Llama-3.3-70B-Instruct": "fireworks-ai" as InferenceProvider,
        "google/gemma-3-27b-it": "hf-inference" as InferenceProvider,
    }
    constructor(private apiKey: string) { 
        super(apiKey)
    }

    async sendPrompt({ texts, model, target_language, provider }: PromptOptions) { 
        if (!this.apiKey) { throw new MissingInferenceAPIKeyException() }
        target_language ||= "English - US"
        const response = await this.chatCompletion({ 
            model,
            provider: provider ?? InferenceClient.InferenceModels[model as InferenceModel],
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


const inference_module = { InferenceClient, MissingInferenceAPIKeyException }
export type HuggingFaceInferenceModule = typeof inference_module
module.exports = inference_module


/*
    
*/