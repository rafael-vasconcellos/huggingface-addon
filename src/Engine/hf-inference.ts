import { IPromptModule } from './Prompt';
const { HfInference } = require('@huggingface/inference') as typeof import('@huggingface/inference')
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



type InferenceProvider = "fireworks-ai" | "hyperbolic" | "together" | "novita" | "nebius" | "sambanova" | "hf-inference" | "featherless-ai" | "groq"

interface PromptOptions { 
    texts: string[], 
    model: string, 
    target_language?: string,
    provider?: InferenceProvider
}

export type InferenceModel = keyof typeof InferenceClient.InferenceModels

class MissingInferenceAPIKeyException extends Error { 
    constructor() { 
        super("No API key provided for Inference!")
    }
}

class InferenceClient extends HfInference { 
    public static InferenceModels: Record<string, InferenceProvider> = { 
        "openai/gpt-oss-120b": "fireworks-ai",
        "deepseek-ai/DeepSeek-R1": "fireworks-ai",
        "deepseek-ai/DeepSeek-R1-0528": "fireworks-ai",
        "deepseek-ai/DeepSeek-V3": "fireworks-ai",
        "deepseek-ai/DeepSeek-V3-0324": "fireworks-ai",
        "deepseek-ai/DeepSeek-V3.1": "fireworks-ai",
        "Qwen/Qwen3-235B-A22B": "fireworks-ai",
        "Qwen/Qwen2.5-72B-Instruct": "hf-inference",
        "Qwen/QwQ-32B": "hf-inference",
        "moonshotai/Kimi-K2-Instruct": "groq",
        "zai-org/GLM-4.5": "fireworks-ai",
        "shisa-ai/shisa-v2-llama3.3-70b": "featherless-ai",
        "meta-llama/Llama-3.3-70B-Instruct": "fireworks-ai",
        "google/gemma-3-27b-it": "hf-inference",
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