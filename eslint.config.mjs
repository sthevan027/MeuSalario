import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

/**
 * ESLint 9 flat config usando a mesma regra que next/core-web-vitals.
 * Evita o aviso "deprecated eslint@8" e as subdependências deprecated do ESLint 8.
 */
export default [...compat.extends('next/core-web-vitals')]
