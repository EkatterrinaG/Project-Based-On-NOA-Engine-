/**
 * Процедурный генератор текстур на основе Perlin Noise
 * Портировано из PerlinNoiseMaker
 */

// ========================================
// Random Generator
// ========================================
class Random {
    constructor() {
        this.m = 2147483647; // 2^31 - 1
        this.a = 16807; // 7^5
        this.q = 127773; // m / a
        this.r = 2836; // m % a
        this.seed = 1;
    }

    setSeed(seed) {
        if (seed <= 0) {
            seed = -(seed % (this.m - 1)) + 1;
        }
        if (seed > this.m - 1) {
            seed = this.m - 1;
        }
        this.seed = seed;
    }

    nextLong() {
        let res = this.a * (this.seed % this.q) - this.r * Math.floor(this.seed / this.q);
        if (res <= 0) {
            res += this.m;
        }
        this.seed = res;
        return res;
    }

    next() {
        let res = this.nextLong();
        return res / this.m;
    }
}

// ========================================
// Perlin Sampler 2D
// ========================================
class PerlinSampler2D {
    constructor(width, height, randseed) {
        this.width = width;
        this.height = height;
        this.randseed = randseed;
        this.gradients = new Array(width * height * 2);

        const rand = new Random();
        rand.setSeed(randseed);

        for (let i = 0; i < this.gradients.length; i += 2) {
            const angle = rand.next() * Math.PI * 2;
            const x = Math.sin(angle);
            const y = Math.cos(angle);

            this.gradients[i] = x;
            this.gradients[i + 1] = y;
        }
    }

    dot(cellX, cellY, vx, vy) {
        const offset = (cellX + cellY * this.width) * 2;
        const wx = this.gradients[offset];
        const wy = this.gradients[offset + 1];
        return wx * vx + wy * vy;
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    sCurve(t) {
        return t * t * (3 - 2 * t);
    }

    getValue(x, y) {
        const xCell = Math.floor(x);
        const yCell = Math.floor(y);
        const xFrac = x - xCell;
        const yFrac = y - yCell;

        const x0 = xCell;
        const y0 = yCell;
        const x1 = xCell === this.width - 1 ? 0 : xCell + 1;
        const y1 = yCell === this.height - 1 ? 0 : yCell + 1;

        const v00 = this.dot(x0, y0, xFrac, yFrac);
        const v10 = this.dot(x1, y0, xFrac - 1, yFrac);
        const v01 = this.dot(x0, y1, xFrac, yFrac - 1);
        const v11 = this.dot(x1, y1, xFrac - 1, yFrac - 1);

        const vx0 = this.lerp(v00, v10, this.sCurve(xFrac));
        const vx1 = this.lerp(v01, v11, this.sCurve(xFrac));

        return this.lerp(vx0, vx1, this.sCurve(yFrac));
    }
}

// ========================================
// Texture Image
// ========================================
class TextureImage {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Array(width * height * 4);
    }

    setRgba(x, y, r, g, b, a) {
        const offset = ((y * this.width) + x) * 4;
        this.data[offset] = r;
        this.data[offset + 1] = g;
        this.data[offset + 2] = b;
        this.data[offset + 3] = a;
    }

    createTurbulence(spec) {
        const numChannels = 1; // Grayscale
        const raster = new Array(this.width * this.height * numChannels);

        for (let i = 0; i < raster.length; ++i) {
            raster[i] = 0;
        }

        let localPeriodInv = 1 / spec.period;
        let freqInv = 1;
        let weight = 0;

        for (let lvlIdx = 0; lvlIdx < spec.levels; ++lvlIdx) {
            const sampler = new PerlinSampler2D(
                Math.ceil(this.width * localPeriodInv),
                Math.ceil(this.height * localPeriodInv),
                spec.randseed + lvlIdx
            );

            for (let j = 0; j < this.height; ++j) {
                for (let i = 0; i < this.width; ++i) {
                    const val = sampler.getValue(i * localPeriodInv, j * localPeriodInv);
                    raster[(i + j * this.width)] += val * Math.pow(freqInv, spec.atten);
                }
            }

            weight += Math.pow(freqInv, spec.atten);
            freqInv *= 0.5;
            localPeriodInv *= 2;
        }

        // Normalize
        const weightInv = 1 / weight;
        for (let j = 0; j < this.height; ++j) {
            for (let i = 0; i < this.width; ++i) {
                raster[(i + j * this.width)] *= weightInv;
            }
        }

        // Convert to RGB
        for (let j = 0; j < this.height; ++j) {
            for (let i = 0; i < this.width; ++i) {
                const offset = (i + j * this.width);
                const val = raster[offset];

                // Normalize from [-1, 1] to [0, 255]
                const gray = ((val + 1) / 2) * 255;

                this.setRgba(i, j, gray, gray, gray, 255);
            }
        }
    }

    pixelate(pixelSize, palette) {
        const newData = new Array(this.width * this.height * 4);

        for (let j = 0; j < this.height; j += pixelSize) {
            for (let i = 0; i < this.width; i += pixelSize) {
                let rSum = 0, gSum = 0, bSum = 0, count = 0;

                for (let dy = 0; dy < pixelSize && (j + dy) < this.height; dy++) {
                    for (let dx = 0; dx < pixelSize && (i + dx) < this.width; dx++) {
                        const offset = ((j + dy) * this.width + (i + dx)) * 4;
                        rSum += this.data[offset];
                        gSum += this.data[offset + 1];
                        bSum += this.data[offset + 2];
                        count++;
                    }
                }

                const avgGray = (rSum + gSum + bSum) / (3 * count);

                let finalColor;
                if (palette) {
                    // Custom palette quantization
                    const levels = palette.length;
                    const paletteIndex = Math.floor((avgGray / 256) * levels);
                    const clampedIndex = Math.max(0, Math.min(levels - 1, paletteIndex));
                    finalColor = palette[clampedIndex];
                } else {
                    // Original quantization (12 levels of gray)
                    const levels = 12;
                    const quantized = Math.round(avgGray / (256 / levels)) * (256 / levels);
                    const clamped = Math.max(0, Math.min(255, quantized));
                    finalColor = { r: clamped, g: clamped, b: clamped };
                }

                for (let dy = 0; dy < pixelSize && (j + dy) < this.height; dy++) {
                    for (let dx = 0; dx < pixelSize && (i + dx) < this.width; dx++) {
                        const offset = ((j + dy) * this.width + (i + dx)) * 4;
                        newData[offset] = finalColor.r;
                        newData[offset + 1] = finalColor.g;
                        newData[offset + 2] = finalColor.b;
                        newData[offset + 3] = 255;
                    }
                }
            }
        }

        this.data = newData;
    }

    toCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        const imgData = ctx.createImageData(this.width, this.height);
        for (let i = 0; i < this.width * this.height * 4; i++) {
            imgData.data[i] = this.data[i];
        }

        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }
}

// ========================================
// Texture Generator
// ========================================
export class TextureGenerator {
    constructor() {
        // Палитры для разных блоков
        this.palettes = {
            stone: [
                { r: 85, g: 85, b: 85 },
                { r: 96, g: 96, b: 96 },
                { r: 108, g: 108, b: 108 },
                { r: 119, g: 119, b: 119 }
            ],
            dirt: [
                { r: 92, g: 64, b: 51 },   // Темно-коричневый
                { r: 101, g: 71, b: 56 },  // Средне-коричневый
                { r: 115, g: 80, b: 64 },  // Светло-коричневый
                { r: 130, g: 91, b: 72 }   // Самый светлый
            ],
            grass_top: [
                { r: 34, g: 102, b: 34 },   // Темно-зелёный
                { r: 51, g: 127, b: 51 },   // Средне-зелёный
                { r: 68, g: 140, b: 68 },   // Светло-зелёный
                { r: 85, g: 153, b: 85 }    // Самый светлый зелёный
            ],
            grass_side: [
                { r: 68, g: 94, b: 51 },    // Темный травяно-землистый
                { r: 85, g: 107, b: 56 },   // Средний травяно-землистый
                { r: 102, g: 119, b: 64 },  // Светлый травяно-землистый
                { r: 115, g: 130, b: 72 }   // Самый светлый травяно-землистый
            ],
            sand: [
                { r: 194, g: 178, b: 128 },  // Светло-песочный
                { r: 210, g: 195, b: 145 },  // Песочный
                { r: 225, g: 210, b: 160 },  // Светлый песок
                { r: 235, g: 220, b: 175 },  // Очень светлый
                { r: 240, g: 230, b: 190 },  // Почти белый песок
                { r: 200, g: 185, b: 135 }   // Средне-песочный
            ],
            sandstone: [
                { r: 170, g: 150, b: 100 },  // Темный песчаник
                { r: 185, g: 165, b: 115 },  // Средне-темный
                { r: 200, g: 180, b: 130 },  // Средний песчаник
                { r: 215, g: 195, b: 145 }   // Светлый песчаник
            ],
            snow_top: [
                { r: 230, g: 235, b: 240 },  // Светло-серо-белый
                { r: 240, g: 243, b: 248 },  // Очень светлый белый
                { r: 248, g: 250, b: 252 },  // Почти белый
                { r: 255, g: 255, b: 255 }   // Чисто белый
            ],
            snow_side: [
                { r: 180, g: 185, b: 190 },  // Серовато-белый (переход земля-снег)
                { r: 200, g: 205, b: 210 },  // Светло-серовато-белый
                { r: 220, g: 225, b: 230 },  // Очень светлый белый
                { r: 235, g: 238, b: 242 }   // Почти чистый белый
            ],
            // Палитры для руд (копия структуры stone, но с цветами руды)
            coal_ore: [
                { r: 85, g: 85, b: 85 },
                { r: 96, g: 96, b: 96 },     // Средне-темный уголь
                { r: 70, g: 70, b: 70 },     // Средний уголь
                { r: 80, g: 80, b: 80 }      // Светлее уголь
            ],
            iron_ore: [
                { r: 85, g: 85, b: 85 },
                { r: 96, g: 96, b: 96 },
                { r: 180, g: 140, b: 115 },
                { r: 85, g: 85, b: 85 }
            ],
            gold_ore: [
                { r: 85, g: 85, b: 85 },
                { r: 96, g: 96, b: 96 },  // Средне-темное золото
                { r: 230, g: 200, b: 70 },   // Среднее золото
                { r: 250, g: 220, b: 90 }    // Светлое золото
            ],
            diamond_ore: [
                { r: 85, g: 85, b: 85 },
                { r: 96, g: 96, b: 96 },  // Средне-темный голубой
                { r: 120, g: 210, b: 240 },  // Средний голубой
                { r: 140, g: 230, b: 255 }   // Светлый голубой
            ],
            // Палитра для дерева дуба (коричневые оттенки для боковых сторон - кора с кольцами)
            oak_wood: [
                { r: 90, g: 60, b: 30 },    // Очень темно-коричневый
                { r: 101, g: 67, b: 33 },   // Темно-коричневый
                { r: 110, g: 73, b: 36 },   // Средне-темный коричневый 1
                { r: 120, g: 80, b: 40 },   // Средне-темный коричневый 2
                { r: 130, g: 85, b: 42 },   // Средний коричневый 1
                { r: 139, g: 90, b: 43 },   // Средний коричневый 2
                { r: 150, g: 100, b: 50 },  // Средне-светлый коричневый
                { r: 160, g: 110, b: 60 }   // Светло-коричневый
            ],
            // Палитра для дерева ели (более темные коричневые оттенки)
            pine_wood: [
                { r: 40, g: 30, b: 18 },    // Очень темно-коричневый (почти черный)
                { r: 50, g: 35, b: 20 },    // Темно-коричневый
                { r: 60, g: 40, b: 22 },    // Средне-темный коричневый 1
                { r: 70, g: 45, b: 24 },    // Средне-темный коричневый 2
                { r: 80, g: 50, b: 26 },    // Средний коричневый 1
                { r: 90, g: 55, b: 28 },    // Средний коричневый 2
                { r: 100, g: 65, b: 32 },   // Средне-светлый коричневый
                { r: 110, g: 75, b: 38 }    // Светло-коричневый
            ],
            // Палитра для листвы (зеленые оттенки)
            leaves: [
                { r: 34, g: 139, b: 34 },   // Темно-зеленый
                { r: 46, g: 160, b: 46 },   // Средне-темный зеленый
                { r: 60, g: 179, b: 60 },   // Средний зеленый
                { r: 76, g: 187, b: 76 }    // Светло-зеленый
            ],
            // Палитра для хвои (темно-зеленые оттенки)
            pine_leaves: [
                { r: 20, g: 80, b: 20 },    // Темный хвойный
                { r: 28, g: 100, b: 28 },   // Средне-темный хвойный
                { r: 36, g: 120, b: 36 },   // Средний хвойный
                { r: 44, g: 140, b: 44 }    // Светло-хвойный
            ],
            // Палитры для цветов (лепестки)
            flower_red: [
                { r: 180, g: 30, b: 30 },
                { r: 200, g: 40, b: 40 },
                { r: 220, g: 50, b: 50 },
                { r: 240, g: 60, b: 60 }
            ],
            flower_yellow: [
                { r: 220, g: 200, b: 30 },
                { r: 235, g: 215, b: 40 },
                { r: 245, g: 225, b: 50 },
                { r: 255, g: 235, b: 60 }
            ],
            flower_blue: [
                { r: 40, g: 80, b: 180 },
                { r: 50, g: 100, b: 200 },
                { r: 60, g: 120, b: 220 },
                { r: 70, g: 140, b: 240 }
            ],
            flower_pink: [
                { r: 220, g: 100, b: 150 },
                { r: 235, g: 120, b: 170 },
                { r: 245, g: 140, b: 185 },
                { r: 255, g: 160, b: 200 }
            ],
            flower_orange: [
                { r: 220, g: 120, b: 30 },
                { r: 235, g: 140, b: 40 },
                { r: 245, g: 160, b: 50 },
                { r: 255, g: 180, b: 60 }
            ],
            flower_purple: [
                { r: 140, g: 50, b: 180 },
                { r: 160, g: 70, b: 200 },
                { r: 180, g: 90, b: 220 },
                { r: 200, g: 110, b: 240 }
            ],
            // Палитра для стебля цветка
            flower_stem: [
                { r: 40, g: 80, b: 30 },
                { r: 50, g: 100, b: 40 },
                { r: 60, g: 120, b: 50 },
                { r: 70, g: 140, b: 60 }
            ]
        };
    }

    /**
     * Генерирует текстуру камня
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры (например 32)
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateStoneTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 16,      // Cell Size
            levels: 2,      // Levels
            atten: 0        // Attenuation
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        // Применяем палитру камня с пикселизацией (4x4 пикселя для блочного вида)
        img.pixelate(2, this.palettes.stone);

        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур камня (несколько вариаций в одном изображении)
     * @param {number} variations - Количество вариаций (например 16 для 4x4 атласа)
     * @param {number} textureSize - Размер одной текстуры (например 32)
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateStoneAtlas(variations = 64, textureSize = 32) {
        // Вертикальный atlas для noa-engine: ширина = textureSize, высота = textureSize * variations
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        // Генерируем вариации вертикально (в столбик)
        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;

            // Каждая вариация использует уникальный seed
            const textureCanvas = this.generateStoneTexture(i + 1, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру земли
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры (например 32)
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateDirtTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 8,      // Cell Size
            levels: 2,      // Levels
            atten: 0        // Attenuation
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        // Применяем палитру земли с пикселизацией (4x4 пикселя для блочного вида)
        img.pixelate(4, this.palettes.dirt);

        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур земли
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateDirtAtlas(variations = 64, textureSize = 32) {
        // Вертикальный atlas для noa-engine
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        // Генерируем вариации вертикально
        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateDirtTexture(i + 1000, textureSize); // +1000 для другого seed range
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру верха травы (зелёная)
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateGrassTopTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 8,
            levels: 2,
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        img.pixelate(4, this.palettes.grass_top);

        return img.toCanvas();
    }

    /**
     * Генерирует текстуру боковой стороны травы (переход земля-трава)
     * Верхняя часть зелёная, нижняя коричневая с неровным переходом (как в Minecraft)
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateGrassSideTexture(seed, size = 32) {
        // Создаём текстуру земли как основу с БОЛЬШИМ количеством шума
        const specDirt = {
            randseed: seed,
            period: 6,      // Меньший период для большей детализации
            levels: 4,      // Больше уровней для более сложной текстуры
            atten: 0
        };

        const imgDirt = new TextureImage(size, size);
        imgDirt.createTurbulence(specDirt);
        imgDirt.pixelate(4, this.palettes.dirt);

        // Создаём финальный canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Рисуем текстуру земли как основу
        const canvasDirt = imgDirt.toCanvas();
        ctx.drawImage(canvasDirt, 0, 0);

        // Получаем ImageData для попиксельного редактирования
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Генерируем шум для неровной границы
        const noiseImg = new TextureImage(size, size);
        const noiseSpec = {
            randseed: seed + 1000,
            period: 4,  // Меньший период для более детального шума
            levels: 3,  // Больше уровней для более сложного шума
            atten: 0
        };
        noiseImg.createTurbulence(noiseSpec);
        const noiseCanvas = noiseImg.toCanvas();
        const noiseCtx = noiseCanvas.getContext('2d');
        const noiseData = noiseCtx.getImageData(0, 0, size, size).data;

        // Параметры перехода
        const baseGrassHeight = Math.floor(size * 0.12); // Базовая высота травы (~12%)
        const transitionZone = Math.floor(size * 0.30);   // Зона перехода (~30% - намного больше неровностей)

        // Проходим по каждому пикселю
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                // Получаем значение шума для этого пикселя (0-255)
                const noiseValue = noiseData[idx];

                // Вычисляем динамическую границу травы с учётом шума
                const noiseFactor = (noiseValue / 255) * transitionZone;
                const grassBoundary = baseGrassHeight + noiseFactor;

                // Если пиксель находится в зоне травы
                if (y < grassBoundary) {
                    // Выбираем цвет из палитры травы на основе шума
                    const grassPalette = this.palettes.grass_top;
                    const paletteIndex = Math.floor((noiseValue / 256) * grassPalette.length);
                    const clampedIndex = Math.max(0, Math.min(grassPalette.length - 1, paletteIndex));
                    const color = grassPalette[clampedIndex];

                    data[idx] = color.r;
                    data[idx + 1] = color.g;
                    data[idx + 2] = color.b;
                    data[idx + 3] = 255;
                }
                // Зона плавного перехода
                else if (y < baseGrassHeight + transitionZone) {
                    const transitionProgress = (y - baseGrassHeight) / transitionZone;

                    // Используем шум для определения, будет ли пиксель травой или землёй
                    if (noiseValue / 255 > transitionProgress) {
                        // Остаётся трава
                        const grassPalette = this.palettes.grass_top;
                        const paletteIndex = Math.floor((noiseValue / 256) * grassPalette.length);
                        const clampedIndex = Math.max(0, Math.min(grassPalette.length - 1, paletteIndex));
                        const color = grassPalette[clampedIndex];

                        data[idx] = color.r;
                        data[idx + 1] = color.g;
                        data[idx + 2] = color.b;
                    }
                    // Иначе остаётся земля (уже нарисована)
                }
                // Остальное - земля (уже нарисована)
            }
        }

        // Применяем изменения
        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    /**
     * Генерирует атлас текстур верха травы
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateGrassTopAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateGrassTopTexture(i + 2000, textureSize); // +2000 для другого seed range
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует атлас текстур боковой стороны травы
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateGrassSideAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateGrassSideTexture(i + 3000, textureSize); // +3000 для другого seed range
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру песка с большим количеством деталей
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateSandTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 4,      // Меньший период = БОЛЬШЕ мелких деталей
            levels: 5,      // Много уровней = ОЧЕНЬ детализированная текстура
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        // Мелкая пикселизация (2x2) для большого количества пикселей
        img.pixelate(2, this.palettes.sand);

        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур песка
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateSandAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateSandTexture(i + 4000, textureSize); // +4000 для другого seed range
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру песчаника
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateSandstoneTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 5,      // Меньший период = больше деталей
            levels: 4,      // Больше уровней = больше деталей
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        img.pixelate(4, this.palettes.sandstone);

        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур песчаника
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateSandstoneAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateSandstoneTexture(i + 5000, textureSize); // +5000 для другого seed range
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру верха снега (белая)
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateSnowTopTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 8,
            levels: 2,
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);
        img.pixelate(4, this.palettes.snow_top);

        return img.toCanvas();
    }

    /**
     * Генерирует текстуру боковой стороны снега (переход земля-снег)
     * Верхняя часть белая, нижняя коричневая с неровным переходом
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateSnowSideTexture(seed, size = 32) {
        // Создаём текстуру земли как основу
        const specDirt = {
            randseed: seed,
            period: 6,
            levels: 4,
            atten: 0
        };

        const imgDirt = new TextureImage(size, size);
        imgDirt.createTurbulence(specDirt);
        imgDirt.pixelate(4, this.palettes.dirt);

        // Создаём финальный canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Рисуем текстуру земли как основу
        const canvasDirt = imgDirt.toCanvas();
        ctx.drawImage(canvasDirt, 0, 0);

        // Получаем ImageData для попиксельного редактирования
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Генерируем шум для неровной границы
        const noiseImg = new TextureImage(size, size);
        const noiseSpec = {
            randseed: seed + 6000,
            period: 4,
            levels: 3,
            atten: 0
        };
        noiseImg.createTurbulence(noiseSpec);
        const noiseCanvas = noiseImg.toCanvas();
        const noiseCtx = noiseCanvas.getContext('2d');
        const noiseData = noiseCtx.getImageData(0, 0, size, size).data;

        // Параметры перехода
        const baseSnowHeight = Math.floor(size * 0.12);
        const transitionZone = Math.floor(size * 0.30);

        // Проходим по каждому пикселю
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                const noiseValue = noiseData[idx];
                const noiseFactor = (noiseValue / 255) * transitionZone;
                const snowBoundary = baseSnowHeight + noiseFactor;

                // Если пиксель находится в зоне снега
                if (y < snowBoundary) {
                    const snowPalette = this.palettes.snow_top;
                    const paletteIndex = Math.floor((noiseValue / 256) * snowPalette.length);
                    const clampedIndex = Math.max(0, Math.min(snowPalette.length - 1, paletteIndex));
                    const color = snowPalette[clampedIndex];

                    data[idx] = color.r;
                    data[idx + 1] = color.g;
                    data[idx + 2] = color.b;
                    data[idx + 3] = 255;
                }
                // Зона плавного перехода
                else if (y < baseSnowHeight + transitionZone) {
                    const transitionProgress = (y - baseSnowHeight) / transitionZone;

                    if (noiseValue / 255 > transitionProgress) {
                        const snowPalette = this.palettes.snow_top;
                        const paletteIndex = Math.floor((noiseValue / 256) * snowPalette.length);
                        const clampedIndex = Math.max(0, Math.min(snowPalette.length - 1, paletteIndex));
                        const color = snowPalette[clampedIndex];

                        data[idx] = color.r;
                        data[idx + 1] = color.g;
                        data[idx + 2] = color.b;
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    /**
     * Генерирует атлас текстур верха снега
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateSnowTopAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateSnowTopTexture(i + 6000, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует атлас текстур боковой стороны снега
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateSnowSideAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateSnowSideTexture(i + 7000, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру руды (копия generateStoneTexture, но с палитрой руды)
     * @param {number} seed - Random seed
     * @param {string} oreType - Тип руды ('coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore')
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateOreTexture(seed, oreType, size = 32) {
        // Используем те же настройки что и для обычного камня
        const spec = {
            randseed: seed,
            period: 16,      // Cell Size (как у камня)
            levels: 2,       // Levels (как у камня)
            atten: 0         // Attenuation (как у камня)
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);

        // Применяем палитру руды с пикселизацией (как у камня)
        const orePalette = this.palettes[oreType] || this.palettes.coal_ore;
        img.pixelate(2, orePalette);

        return img.toCanvas();
    }

    /**
     * Генерирует текстуру дерева с концентрическими кольцами
     * @param {number} seed - Random seed
     * @param {string} woodType - Тип дерева ('oak_wood' или 'pine_wood')
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateWoodTexture(seed, woodType = 'oak_wood', size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        // Генерируем шум для концентрических колец (годовые кольца дерева)
        const spec = {
            randseed: seed,
            period: 8,
            levels: 2,
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);

        const noiseCanvas = img.toCanvas();
        const noiseCtx = noiseCanvas.getContext('2d');
        const noiseData = noiseCtx.getImageData(0, 0, size, size).data;

        const woodPalette = this.palettes[woodType] || this.palettes.oak_wood;

        // Центр текстуры (для концентрических колец)
        const centerX = size / 2;
        const centerY = size / 2;

        // Создаем концентрические кольца (годовые кольца дерева)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;

                // Расстояние от центра (для концентрических колец)
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Получаем шум для этой точки
                const noiseIdx = (y * size + x) * 4;
                const noiseValue = noiseData[noiseIdx];

                // Комбинируем расстояние и шум для создания колец
                const ringValue = (distance * 4 + noiseValue / 8) % 256;

                // Выбираем цвет из палитры на основе значения кольца
                const paletteIndex = Math.floor((ringValue / 256) * woodPalette.length);
                const clampedIndex = Math.max(0, Math.min(woodPalette.length - 1, paletteIndex));
                const color = woodPalette[clampedIndex];

                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Генерирует атлас текстур дерева дуба
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateOakWoodAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateWoodTexture(i + 1000, 'oak_wood', textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует атлас текстур дерева ели
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generatePineWoodAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateWoodTexture(i + 1000, 'pine_wood', textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру торца дерева (тёмная с каменной текстурой)
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateWoodTopTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 16,
            levels: 2,
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);

        // Очень тёмная палитра для торцов ели
        const darkWoodPalette = [
            { r: 25, g: 20, b: 15 },
            { r: 30, g: 24, b: 18 },
            { r: 28, g: 22, b: 16 },
            { r: 35, g: 28, b: 20 },
            { r: 32, g: 25, b: 18 }
        ];

        img.pixelate(2, darkWoodPalette);
        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур торцов дерева
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateWoodTopAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateWoodTopTexture(i + 2000, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует светлую текстуру торца дерева (для дуба)
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateLightWoodTopTexture(seed, size = 32) {
        const spec = {
            randseed: seed,
            period: 16,
            levels: 2,
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);

        // Затемнённая палитра для торцов дуба
        const lightWoodPalette = [
            { r: 100, g: 75, b: 50 },
            { r: 110, g: 82, b: 55 },
            { r: 105, g: 78, b: 52 },
            { r: 115, g: 86, b: 58 },
            { r: 108, g: 80, b: 54 }
        ];

        img.pixelate(2, lightWoodPalette);
        return img.toCanvas();
    }

    /**
     * Генерирует атлас светлых текстур торцов дерева (для дуба)
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateLightWoodTopAtlas(variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateLightWoodTopTexture(i + 3000, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует текстуру листвы (как камень, но более детализированная)
     * @param {number} seed - Random seed
     * @param {string} leafType - Тип листвы ('leaves' или 'pine_leaves')
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateLeavesTexture(seed, leafType = 'leaves', size = 32) {
        // Очень детализированная версия для листвы
        const spec = {
            randseed: seed,
            period: 6,       // Еще меньший period для максимальной детализации (было 8)
            levels: 7,       // Больше уровней для еще большей детализации (было 3)
            atten: 0
        };

        const img = new TextureImage(size, size);
        img.createTurbulence(spec);

        // Применяем палитру листвы с пикселизацией
        const leavesPalette = this.palettes[leafType] || this.palettes.leaves;
        img.pixelate(2, leavesPalette);

        return img.toCanvas();
    }

    /**
     * Генерирует атлас текстур листвы
     * @param {string} leafType - Тип листвы ('leaves' или 'pine_leaves')
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateLeavesAtlas(leafType, variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        // Генерируем вариации вертикально (в столбик)
        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;

            // Каждая вариация использует уникальный seed
            const textureCanvas = this.generateLeavesTexture(i + 2000, leafType, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Генерирует атлас текстур руды
     * @param {string} oreType - Тип руды
     * @param {number} variations - Количество вариаций
     * @param {number} textureSize - Размер одной текстуры
     * @returns {HTMLCanvasElement} Canvas с атласом текстур
     */
    generateOreAtlas(oreType, variations = 64, textureSize = 32) {
        const atlasWidth = textureSize;
        const atlasHeight = textureSize * variations;

        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasWidth;
        atlasCanvas.height = atlasHeight;
        const ctx = atlasCanvas.getContext('2d');

        // Разные seed ranges для разных руд
        const seedOffset = {
            'coal_ore': 10000,
            'iron_ore': 20000,
            'gold_ore': 30000,
            'diamond_ore': 40000
        }[oreType] || 10000;

        for (let i = 0; i < variations; i++) {
            const y = i * textureSize;
            const textureCanvas = this.generateOreTexture(i + seedOffset, oreType, textureSize);
            ctx.drawImage(textureCanvas, 0, y);
        }

        return atlasCanvas;
    }

    /**
     * Извлекает отдельные текстуры из атласа
     * @param {HTMLCanvasElement} atlasCanvas - Atlas canvas
     * @param {number} textureSize - Размер одной текстуры (32)
     * @param {number} tilesPerRow - Количество текстур в ряду
     * @returns {Array<string>} Массив Data URLs для каждой текстуры
     */
    extractTexturesFromAtlas(atlasCanvas, textureSize, tilesPerRow) {
        const ctx = atlasCanvas.getContext('2d');
        const textures = [];
        const totalTiles = tilesPerRow * tilesPerRow;

        // Создаём временный canvas для вырезания текстур
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = textureSize;
        tempCanvas.height = textureSize;
        const tempCtx = tempCanvas.getContext('2d');

        for (let i = 0; i < totalTiles; i++) {
            const col = i % tilesPerRow;
            const row = Math.floor(i / tilesPerRow);
            const sx = col * textureSize;
            const sy = row * textureSize;

            // Вырезаем текстуру из atlas
            const imageData = ctx.getImageData(sx, sy, textureSize, textureSize);

            // Рисуем на временном canvas
            tempCtx.putImageData(imageData, 0, 0);

            // Конвертируем в Data URL
            const dataURL = tempCanvas.toDataURL('image/png');
            textures.push(dataURL);
        }

        return textures;
    }

    /**
     * Генерирует текстуру цветка для crossed quads
     * Текстура представляет собой лепестки с прозрачным фоном
     * @param {number} seed - Random seed
     * @param {string} flowerColor - Цвет цветка ('red', 'yellow', 'blue', 'pink', 'orange', 'purple')
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой (с альфа-каналом)
     */
    generateFlowerTexture(seed, flowerColor = 'red', size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Заполняем прозрачным фоном
        ctx.clearRect(0, 0, size, size);

        const palette = this.palettes[`flower_${flowerColor}`] || this.palettes.flower_red;
        const stemPalette = this.palettes.flower_stem;
        const centerY = size * 0.6; // Центр цветка по Y (верхняя часть текстуры)
        const centerX = size / 2;

        // Рисуем стебель (нижняя часть текстуры)
        const stemWidth = Math.max(2, Math.floor(size * 0.1));
        const stemStartY = centerY + size * 0.1;

        for (let y = Math.floor(stemStartY); y < size; y++) {
            for (let x = Math.floor(centerX - stemWidth / 2); x < Math.floor(centerX + stemWidth / 2); x++) {
                if (x >= 0 && x < size) {
                    const colorIdx = Math.floor(Math.random() * stemPalette.length);
                    const color = stemPalette[colorIdx];
                    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Рисуем лепестки (5 лепестков в форме звезды)
        const petalLength = size * 0.35;
        const petalWidth = size * 0.15;
        const numPetals = 5;

        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2 - Math.PI / 2; // Начинаем сверху
            const petalCenterX = centerX + Math.cos(angle) * petalLength * 0.5;
            const petalCenterY = centerY + Math.sin(angle) * petalLength * 0.5;

            // Рисуем эллипс для каждого лепестка
            for (let py = -petalLength; py <= petalLength; py++) {
                for (let px = -petalWidth; px <= petalWidth; px++) {
                    // Вращаем точку в направлении лепестка
                    const rotX = px * Math.cos(angle) - py * Math.sin(angle);
                    const rotY = px * Math.sin(angle) + py * Math.cos(angle);

                    // Проверяем, находится ли точка внутри эллипса
                    const normalizedX = px / petalWidth;
                    const normalizedY = py / petalLength;
                    const dist = normalizedX * normalizedX + normalizedY * normalizedY;

                    if (dist <= 1) {
                        const finalX = Math.floor(petalCenterX + rotX);
                        const finalY = Math.floor(petalCenterY + rotY);

                        if (finalX >= 0 && finalX < size && finalY >= 0 && finalY < size) {
                            // Выбираем цвет на основе расстояния от центра (градиент)
                            const colorIdx = Math.min(palette.length - 1, Math.floor(dist * palette.length));
                            const color = palette[colorIdx];
                            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                            ctx.fillRect(finalX, finalY, 1, 1);
                        }
                    }
                }
            }
        }

        // Рисуем центр цветка (желтый/оранжевый)
        const centerRadius = size * 0.1;
        const centerColors = [
            { r: 255, g: 220, b: 50 },
            { r: 255, g: 200, b: 30 },
            { r: 240, g: 180, b: 20 }
        ];

        for (let dy = -centerRadius; dy <= centerRadius; dy++) {
            for (let dx = -centerRadius; dx <= centerRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= centerRadius) {
                    const px = Math.floor(centerX + dx);
                    const py = Math.floor(centerY + dy);
                    if (px >= 0 && px < size && py >= 0 && py < size) {
                        const colorIdx = Math.floor(Math.random() * centerColors.length);
                        const color = centerColors[colorIdx];
                        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                        ctx.fillRect(px, py, 1, 1);
                    }
                }
            }
        }

        return canvas;
    }

    /**
     * Генерирует Data URL текстуры цветка
     * @param {string} flowerColor - Цвет цветка
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {string} Data URL текстуры
     */
    generateFlowerTextureURL(flowerColor = 'red', seed = 1, size = 64) {
        const canvas = this.generateFlowerTexture(seed, flowerColor, size);
        return canvas.toDataURL('image/png');
    }

    /**
     * Генерирует текстуру только короны цветка (лепестки + центр, без стебля)
     * Для использования в L-System генерации
     * @param {number} seed - Random seed
     * @param {string} flowerColor - Цвет цветка
     * @param {number} size - Размер текстуры
     * @returns {HTMLCanvasElement} Canvas с текстурой
     */
    generateFlowerCrownTexture(seed, flowerColor = 'red', size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);

        const palette = this.palettes[`flower_${flowerColor}`] || this.palettes.flower_red;
        const centerX = size / 2;
        const centerY = size / 2;

        // Рисуем лепестки (5 штук)
        const petalLength = size * 0.4;
        const petalWidth = size * 0.18;
        const numPetals = 5;

        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2 - Math.PI / 2;
            const petalCenterX = centerX + Math.cos(angle) * petalLength * 0.4;
            const petalCenterY = centerY + Math.sin(angle) * petalLength * 0.4;

            for (let py = -petalLength; py <= petalLength; py++) {
                for (let px = -petalWidth; px <= petalWidth; px++) {
                    const rotX = px * Math.cos(angle) - py * Math.sin(angle);
                    const rotY = px * Math.sin(angle) + py * Math.cos(angle);

                    const normalizedX = px / petalWidth;
                    const normalizedY = py / petalLength;
                    const dist = normalizedX * normalizedX + normalizedY * normalizedY;

                    if (dist <= 1) {
                        const finalX = Math.floor(petalCenterX + rotX);
                        const finalY = Math.floor(petalCenterY + rotY);

                        if (finalX >= 0 && finalX < size && finalY >= 0 && finalY < size) {
                            const colorIdx = Math.min(palette.length - 1, Math.floor(dist * palette.length));
                            const color = palette[colorIdx];
                            ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                            ctx.fillRect(finalX, finalY, 1, 1);
                        }
                    }
                }
            }
        }

        // Рисуем центр цветка
        const centerRadius = size * 0.12;
        const centerColors = [
            { r: 255, g: 220, b: 50 },
            { r: 255, g: 200, b: 30 },
            { r: 240, g: 180, b: 20 }
        ];

        for (let dy = -centerRadius; dy <= centerRadius; dy++) {
            for (let dx = -centerRadius; dx <= centerRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= centerRadius) {
                    const px = Math.floor(centerX + dx);
                    const py = Math.floor(centerY + dy);
                    if (px >= 0 && px < size && py >= 0 && py < size) {
                        const colorIdx = Math.floor(Math.random() * centerColors.length);
                        const color = centerColors[colorIdx];
                        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                        ctx.fillRect(px, py, 1, 1);
                    }
                }
            }
        }

        return canvas;
    }

    /**
     * Генерирует Data URL текстуры короны цветка
     * @param {string} flowerColor - Цвет цветка
     * @param {number} seed - Random seed
     * @param {number} size - Размер текстуры
     * @returns {string} Data URL текстуры
     */
    generateFlowerCrownTextureURL(flowerColor = 'red', seed = 1, size = 32) {
        const canvas = this.generateFlowerCrownTexture(seed, flowerColor, size);
        return canvas.toDataURL('image/png');
    }

    /**
     * Генерирует текстуру ломания блока (cracking animation stage)
     */
    generateCrackingTexture(stage = 0, size = 32) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;

        const rand = new Random();
        rand.setSeed(42); // Фиксированный seed для одинакового паттерна

        const numCracks = Math.floor((stage + 1) * 3);
        for (let i = 0; i < numCracks; i++) {
            ctx.beginPath();
            let x = rand.next() * size;
            let y = rand.next() * size;
            ctx.moveTo(x, y);

            for (let j = 0; j < 3; j++) {
                x += (rand.next() - 0.5) * size * 0.4;
                y += (rand.next() - 0.5) * size * 0.4;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        return canvas;
    }
}
