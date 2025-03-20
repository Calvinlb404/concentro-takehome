import {useState} from "react";
import acios from "axios";
import * as pdfjs from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [pdfText, setPdfText] = useState<String | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const extractText = async (file: File) => {
        try{
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                const typedArray = new Uint8Array(reader.result as ArrayBuffer);
                const pdf = await pdfjs.getDocument(typedArray).promise;
                let extractedText = "";
                for(let i = 1; i<=pdf.numPages; i++){
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    extractedText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
                }

                setPdfText(extractedText);
            }
        }
        catch (error){
            console.error("Error extracting text:", error);

        }
    };


}
