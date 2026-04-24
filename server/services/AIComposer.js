/**
 * AI Composer Service
 * Integrates with Nano Banana Pro (Gemini 3.0 Pro Image) or ComfyUI
 */
class AIComposer {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'nanobanana';
        this.apiKey = process.env.NANOBANANA_API_KEY;
        this.comfyuiUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
    }

    /**
     * Compose a cohesive fursona from three body parts
     */
    async composeFursona(headData, torsoData, legsData, styleInfo = {}) {
        // Remove data URL prefix if present
        const cleanBase64 = (data) => {
            if (data && data.includes(',')) {
                return data.split(',')[1];
            }
            return data;
        };

        const head = cleanBase64(headData);
        const torso = cleanBase64(torsoData);
        const legs = cleanBase64(legsData);

        // Store style info for prompt building
        this.currentStyle = styleInfo.artStyle || 'cartoon';
        this.currentBackground = styleInfo.background || 'simple gradient';

        if (this.provider === 'comfyui') {
            return await this.composeWithComfyUI(head, torso, legs);
        } else {
            return await this.composeWithNanoBanana(head, torso, legs);
        }
    }

    /**
     * Compose using Nano Banana Pro (Gemini 3.0 Pro Image)
     */
    async composeWithNanoBanana(head, torso, legs) {
        if (!this.apiKey) {
            throw new Error('NANOBANANA_API_KEY not configured. Add your Google AI API key to .env');
        }

        const prompt = this.buildPrompt();

        // Try different model endpoints that support image generation
        // Updated models for 2026 - Gemini image generation models
        const models = [
            'gemini-2.0-flash-preview-image-generation',
            'gemini-2.0-flash-exp-image-generation',
            'gemini-1.5-flash-002',
            'gemini-1.5-pro-002'
        ];

        let lastError = null;

        for (const model of models) {
            try {
                return await this.tryGenerateWithModel(model, prompt, head, torso, legs);
            } catch (error) {
                console.log(`Model ${model} failed:`, error.message);
                lastError = error;
            }
        }

        throw lastError || new Error('All AI models failed');
    }

    async tryGenerateWithModel(model, prompt, head, torso, legs) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: head
                                }
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: torso
                                }
                            },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: legs
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        responseModalities: ['IMAGE', 'TEXT']
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
        }

        const result = await response.json();

        // Extract image from response
        const imagePart = result.candidates?.[0]?.content?.parts?.find(
            p => p.inlineData || p.inline_data
        );

        if (imagePart) {
            const data = imagePart.inlineData || imagePart.inline_data;
            return `data:${data.mimeType || data.mime_type || 'image/png'};base64,${data.data}`;
        }

        // If no image, the model may not support image generation
        throw new Error('Model does not support image generation');
    }

    /**
     * Compose using ComfyUI (self-hosted)
     */
    async composeWithComfyUI(head, torso, legs) {
        try {
            // ComfyUI workflow for image composition
            // This is a simplified version - actual workflow would be more complex
            const workflow = this.buildComfyUIWorkflow(head, torso, legs);

            // Queue the prompt
            const queueResponse = await fetch(`${this.comfyuiUrl}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: workflow })
            });

            if (!queueResponse.ok) {
                throw new Error('ComfyUI queue failed');
            }

            const { prompt_id } = await queueResponse.json();

            // Poll for result
            const result = await this.pollComfyUIResult(prompt_id);
            return result;

        } catch (error) {
            console.error('ComfyUI error:', error);
            throw error;
        }
    }

    /**
     * Build the AI prompt for fursona composition
     */
    buildPrompt() {
        const artStyle = this.currentStyle || 'cartoon';
        const background = this.currentBackground || 'simple gradient';

        return `Make this Gartic Phone / Exquisite Corpse collaborative drawing into a ${artStyle} style anthro furry character ${background}.

I have three hand-drawn images representing different parts of a furry character (fursona):
1. The HEAD (first image)
2. The TORSO/body (second image)
3. The LEGS/feet (third image)

These were drawn by different people who could only see small hints of where to connect their sections.

IMPORTANT: Keep the result as close to the original drawings as possible while:
- Combining all three body sections into one unified ${artStyle} style character
- Maintaining the colors, features, and details from each original drawing
- Creating smooth, natural transitions between the body sections
- Placing the character ${background}
- Showing the full character in a standing or dynamic pose

The final result should honor all three artists' contributions while appearing as a cohesive ${artStyle} anthro furry character.`;
    }

    /**
     * Build ComfyUI workflow for image composition
     * This is a template - actual workflow depends on installed nodes
     */
    buildComfyUIWorkflow(head, torso, legs) {
        // Simplified workflow structure
        // In practice, this would use IPAdapter, ControlNet, etc.
        return {
            "1": {
                "class_type": "LoadImageFromBase64",
                "inputs": { "image": head }
            },
            "2": {
                "class_type": "LoadImageFromBase64",
                "inputs": { "image": torso }
            },
            "3": {
                "class_type": "LoadImageFromBase64",
                "inputs": { "image": legs }
            },
            "4": {
                "class_type": "ImageConcat",
                "inputs": {
                    "images": ["1", "2", "3"],
                    "direction": "vertical"
                }
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["6", 0],
                    "positive": ["7", 0],
                    "negative": ["8", 0],
                    "latent_image": ["4", 0],
                    "seed": Math.floor(Math.random() * 1000000),
                    "steps": 20,
                    "cfg": 7,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 0.5
                }
            },
            "6": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": { "ckpt_name": "furry_model.safetensors" }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "cohesive furry character, full body, unified art style, smooth transitions",
                    "clip": ["6", 1]
                }
            },
            "8": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "disconnected, mismatched, ugly, deformed",
                    "clip": ["6", 1]
                }
            },
            "9": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["6", 2]
                }
            },
            "10": {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["9", 0],
                    "filename_prefix": "fursona"
                }
            }
        };
    }

    /**
     * Poll ComfyUI for result
     */
    async pollComfyUIResult(promptId, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const historyResponse = await fetch(`${this.comfyuiUrl}/history/${promptId}`);
            if (!historyResponse.ok) continue;

            const history = await historyResponse.json();
            const promptHistory = history[promptId];

            if (promptHistory?.outputs) {
                // Find the output image
                for (const nodeOutput of Object.values(promptHistory.outputs)) {
                    if (nodeOutput.images) {
                        const image = nodeOutput.images[0];
                        // Fetch the image
                        const imageResponse = await fetch(
                            `${this.comfyuiUrl}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type || 'output'}`
                        );
                        const imageBuffer = await imageResponse.arrayBuffer();
                        const base64 = Buffer.from(imageBuffer).toString('base64');
                        return `data:image/png;base64,${base64}`;
                    }
                }
            }
        }

        throw new Error('ComfyUI generation timed out');
    }
}

module.exports = AIComposer;
