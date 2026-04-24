/**
 * AI Composer Service
 * Integrates with kie.ai API (Nano Banana 2) or ComfyUI
 */
class AIComposer {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'kieai';
        this.apiKey = process.env.KIE_API_KEY || process.env.NANOBANANA_API_KEY;
        this.comfyuiUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
        this.kieApiUrl = 'https://api.kie.ai/api/v1/jobs';
    }

    /**
     * Compose a cohesive fursona from three body parts
     */
    async composeFursona(headData, torsoData, legsData, styleInfo = {}) {
        // Store style info for prompt building
        this.currentStyle = styleInfo.artStyle || 'cartoon';
        this.currentBackground = styleInfo.background || 'simple gradient';

        if (this.provider === 'comfyui') {
            return await this.composeWithComfyUI(headData, torsoData, legsData);
        } else {
            return await this.composeWithKieAI(headData, torsoData, legsData);
        }
    }

    /**
     * Compose using kie.ai API (Nano Banana 2)
     * Docs: https://docs.kie.ai/market/google/nanobanana2
     */
    async composeWithKieAI(head, torso, legs) {
        if (!this.apiKey) {
            throw new Error('KIE_API_KEY not configured. Add your kie.ai API key to .env');
        }

        const prompt = this.buildPrompt();

        // Ensure images have proper data URL format
        const formatDataUrl = (data) => {
            if (!data) return null;
            if (data.startsWith('data:')) return data;
            return `data:image/png;base64,${data}`;
        };

        const images = [
            formatDataUrl(head),
            formatDataUrl(torso),
            formatDataUrl(legs)
        ].filter(Boolean);

        try {
            // Create task
            const createResponse = await fetch(`${this.kieApiUrl}/createTask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'nano-banana-2',
                    input: {
                        prompt: prompt,
                        image_input: images,
                        aspect_ratio: '9:16', // Portrait orientation
                        resolution: '1K',
                        output_format: 'png'
                    }
                })
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`kie.ai API error: ${createResponse.status} - ${errorText}`);
            }

            const createResult = await createResponse.json();

            if (createResult.code !== 200 || !createResult.data?.taskId) {
                throw new Error(`kie.ai task creation failed: ${createResult.msg || 'Unknown error'}`);
            }

            const taskId = createResult.data.taskId;
            console.log(`kie.ai task created: ${taskId}`);

            // Poll for result
            const result = await this.pollKieAIResult(taskId);
            return result;

        } catch (error) {
            console.error('kie.ai error:', error);
            throw error;
        }
    }

    /**
     * Poll kie.ai for task result
     * Docs: https://docs.kie.ai/market/common/get-task-detail
     */
    async pollKieAIResult(taskId, maxAttempts = 120, intervalMs = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));

            try {
                const response = await fetch(
                    `${this.kieApiUrl}/recordInfo?taskId=${taskId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`
                        }
                    }
                );

                if (!response.ok) {
                    console.log(`Poll attempt ${i + 1}: HTTP ${response.status}`);
                    continue;
                }

                const result = await response.json();

                if (result.code !== 200) {
                    console.log(`Poll attempt ${i + 1}: ${result.msg}`);
                    continue;
                }

                const state = result.data?.state;

                if (state === 'completed' || state === 'success') {
                    // Extract result image URL
                    const resultJson = result.data?.resultJson;
                    if (resultJson) {
                        const parsed = typeof resultJson === 'string'
                            ? JSON.parse(resultJson)
                            : resultJson;

                        // Get the output image URL
                        const imageUrl = parsed.output || parsed.image || parsed.url ||
                                        (parsed.images && parsed.images[0]);

                        if (imageUrl) {
                            // Fetch and convert to base64
                            return await this.fetchImageAsBase64(imageUrl);
                        }
                    }
                    throw new Error('No image in result');
                }

                if (state === 'failed' || state === 'error') {
                    throw new Error(`Generation failed: ${result.data?.failMsg || 'Unknown error'}`);
                }

                // Still processing, continue polling
                console.log(`Poll attempt ${i + 1}: state=${state}`);

            } catch (error) {
                if (error.message.includes('Generation failed')) {
                    throw error;
                }
                console.log(`Poll attempt ${i + 1} error:`, error.message);
            }
        }

        throw new Error('kie.ai generation timed out');
    }

    /**
     * Fetch an image URL and convert to base64 data URL
     */
    async fetchImageAsBase64(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';

        return `data:${contentType};base64,${base64}`;
    }

    /**
     * Build the AI prompt for fursona composition
     */
    buildPrompt() {
        const artStyle = this.currentStyle || 'cartoon';
        const background = this.currentBackground || 'simple gradient';

        return `Create a PORTRAIT orientation (tall, not wide) full-body ${artStyle} style anthro furry character ${background}.

CRITICAL REQUIREMENTS:
- Output must be PORTRAIT orientation (taller than wide, like a character portrait)
- Keep the result as close to the original drawings as possible
- Maintain the colors, features, and details from the original drawing
- Place the character ${background}`;
    }

    /**
     * Compose using ComfyUI (self-hosted)
     */
    async composeWithComfyUI(head, torso, legs) {
        // Remove data URL prefix if present
        const cleanBase64 = (data) => {
            if (data && data.includes(',')) {
                return data.split(',')[1];
            }
            return data;
        };

        const headClean = cleanBase64(head);
        const torsoClean = cleanBase64(torso);
        const legsClean = cleanBase64(legs);

        try {
            const workflow = this.buildComfyUIWorkflow(headClean, torsoClean, legsClean);

            const queueResponse = await fetch(`${this.comfyuiUrl}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: workflow })
            });

            if (!queueResponse.ok) {
                throw new Error('ComfyUI queue failed');
            }

            const { prompt_id } = await queueResponse.json();
            const result = await this.pollComfyUIResult(prompt_id);
            return result;

        } catch (error) {
            console.error('ComfyUI error:', error);
            throw error;
        }
    }

    /**
     * Build ComfyUI workflow for image composition
     */
    buildComfyUIWorkflow(head, torso, legs) {
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
                for (const nodeOutput of Object.values(promptHistory.outputs)) {
                    if (nodeOutput.images) {
                        const image = nodeOutput.images[0];
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
