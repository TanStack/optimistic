import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

global.IS_REACT_ACT_ENVIRONMENT = true
// https://testing-library.com/docs/react-testing-library/api#cleanup
afterEach(() => cleanup())
