import { IPromptModule } from './Prompt';
const { HfInference } = require('@huggingface/inference') as typeof import('@huggingface/inference')
const { systemPrompt, userPrompt } = require("./Prompt") as IPromptModule;



type InferenceProvider = "fireworks-ai" | "hyperbolic" | "together" | "novita" | "nebius" | "sambanova" | "hf-inference" | "featherless-ai" | "groq" | "cohere"

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
        "deepseek-ai/DeepSeek-V3.1-Terminus": "novita",
        "deepseek-ai/DeepSeek-V3.2-Exp": "novita",
        "deepseek-ai/DeepSeek-V3.2": "novita",

        "Qwen/Qwen3-Coder-480B-A35B-Instruct": "novita",
        "Qwen/Qwen3-Next-80B-A3B-Instruct": "novita",
        "Qwen/Qwen3-Next-80B-A3B-Thinking": "novita",
        "Qwen/Qwen3-235B-A22B-Instruct-2507": "novita",
        "Qwen/Qwen2.5-72B-Instruct": "hf-inference",

        "moonshotai/Kimi-K2-Instruct": "groq",
        "moonshotai/Kimi-K2-Instruct-0905": "novita",

        "CohereLabs/command-a-translate-08-2025": "cohere",

        "google/gemma-3-27b-it": "hf-inference",
        "zai-org/GLM-4.5": "fireworks-ai",
        "zai-org/GLM-4.6": "novita",
        "zai-org/GLM-4.7": "novita",
        "shisa-ai/shisa-v2-llama3.3-70b": "featherless-ai",
        "meta-llama/Llama-3.3-70B-Instruct": "fireworks-ai",
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