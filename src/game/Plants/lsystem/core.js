/**
 * L-System Core - генератор строк по правилам
 */

export class LSystem {
    /**
     * @param {string} axiom - начальная строка
     * @param {Object<string, string>} rules - правила замены
     * @param {number} iterations - количество итераций
     */
    constructor(axiom, rules, iterations = 1) {
        this.axiom = axiom
        this.rules = rules
        this.iterations = iterations
    }

    /**
     * Генерирует итоговую L-string
     * @returns {string}
     */
    generate() {
        let result = this.axiom
        for (let i = 0; i < this.iterations; i++) {
            result = this.applyRules(result)
        }
        return result
    }

    /**
     * Применяет правила к строке
     * @param {string} str
     * @returns {string}
     */
    applyRules(str) {
        let result = ''
        for (const char of str) {
            result += this.rules[char] !== undefined ? this.rules[char] : char
        }
        return result
    }
}

/**
 * Символы L-системы для цветов:
 * F - сегмент стебля вперед (вверх)
 * f - короткий сегмент стебля
 * + - поворот вправо по Y (yaw)
 * - - поворот влево по Y
 * ^ - наклон вверх (pitch up)
 * & - наклон вниз (pitch down)
 * \ - крен вправо (roll right)
 * / - крен влево (roll left)
 * | - разворот на 180 градусов
 * [ - сохранить состояние (push)
 * ] - восстановить состояние (pop)
 * P - лепесток
 * L - лист
 * C - центр цветка (пестик/тычинки)
 */

// Предустановленные типы кактусов
// L-образные ветки как в Minecraft: горизонтально (+/-), потом вверх (^)
export const CACTUS_PRESETS = {
    // Простой столбик без веток
    simple: {
        axiom: 'FFFF',
        rules: {},
        iterations: 1
    },

    // Маленький столбик
    tiny: {
        axiom: 'FF',
        rules: {},
        iterations: 1
    },

    // Классический с двумя L-ветками (как в Minecraft)
    classic: {
        axiom: 'FF[+F^FF]FF[-F^FF]FF',
        rules: {},
        iterations: 1
    },

    // Одна ветка справа
    oneArmRight: {
        axiom: 'FFF[+F^FFF]FFF',
        rules: {},
        iterations: 1
    },

    // Одна ветка слева
    oneArmLeft: {
        axiom: 'FFF[-F^FFF]FFF',
        rules: {},
        iterations: 1
    },

    // Высокий с веткой посередине
    tall: {
        axiom: 'FFFF[+F^FF]FFFF',
        rules: {},
        iterations: 1
    },

    // Три ветки
    threeArms: {
        axiom: 'FF[+F^F]FF[-F^FF]FF[+F^F]FF',
        rules: {},
        iterations: 1
    },

    // Короткий с короткими ветками
    short: {
        axiom: 'F[+F^F]F[-F^F]F',
        rules: {},
        iterations: 1
    }
}

// Предустановленные типы цветов
export const FLOWER_PRESETS = {
    // Простая ромашка - лепестки вокруг центра
    daisy: {
        axiom: 'FA',
        rules: {
            'A': '[+P][++P][+++P][-P][--P][---P][^P][&P]C'
        },
        iterations: 1
    },

    // Тюльпан - закрытые лепестки
    tulip: {
        axiom: 'FFA',
        rules: {
            'A': '[^+P][^-P][^++P][^--P]'
        },
        iterations: 1
    },

    // Колокольчик - поникший цветок
    bellflower: {
        axiom: 'FFA',
        rules: {
            'A': '&[+P][-P][++P][--P]C'
        },
        iterations: 1
    },

    // Подсолнух - много лепестков
    sunflower: {
        axiom: 'FFFA',
        rules: {
            'A': '[+P][++P][+++P][++++P][-P][--P][---P][----P][^P][^^P][&P][&&P]C'
        },
        iterations: 1
    },

    // Роза - спиральные лепестки
    rose: {
        axiom: 'FFA',
        rules: {
            'A': '[+^P][++^P][+++^P][-^P][--^P][---^P]C'
        },
        iterations: 1
    },

    // Лилия - крупные загнутые лепестки
    lily: {
        axiom: 'FFA',
        rules: {
            'A': '[+&P][-&P][++&P][--&P][^P][&P]C'
        },
        iterations: 1
    },

    // Одуванчик - пушистый
    dandelion: {
        axiom: 'FFFA',
        rules: {
            'A': 'B',
            'B': '[+P][++P][+++P][++++P][+++++P][-P][--P][---P][----P][-----P][^P][^^P][^^^P][&P][&&P][&&&P]C'
        },
        iterations: 2
    },

    // Орхидея - асимметричные лепестки
    orchid: {
        axiom: 'FFA',
        rules: {
            'A': '[++^P][--^P][+&P][-&P][^^P]C'
        },
        iterations: 1
    }
}

export default LSystem
