import { useContext } from "react";
import { CRMContext } from "./CRMContext";


export const useCRM = () => {
    const context = useContext(CRMContext);
    if (context === undefined) {
      throw new Error("useCRM must be used within a CRMProvider");
    }
    return context;
};