import { defineSpaApp } from "spa-converter/lib/ReactSpaConverter"

import { render, unmountComponentAtNode } from "react-dom";
import FlowChart from "./views/FlowChart";

export default defineSpaApp((container) => {
    return {
        mount() {
            render(<FlowChart/>, container)
        },
        render() {
            return ''
        },
        unmount() {
            unmountComponentAtNode(container)
        }
    }
})