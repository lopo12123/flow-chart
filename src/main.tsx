import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./styles/index.scss";

import { StrictMode } from "react";
import { render } from "react-dom";
import FlowChart from "@flowChart/views/FlowChart";

render(
    <StrictMode>
        <FlowChart/>
    </StrictMode>,
    document.getElementById('root')
)
