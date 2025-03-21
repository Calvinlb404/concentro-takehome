import { useState } from "react";
import axios from "axios";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;


export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [pdfText, setPdfText] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const extractPDFText = async (file: File) => {
        try {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                const typedArray = new Uint8Array(reader.result as ArrayBuffer);
                const pdf = await pdfjs.getDocument(typedArray).promise;

                let text = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => item.str).join(" ") + "\n";
                }

                console.log("Bank Statement PDF text:", text);
                setPdfText(text);
            };
        } catch (error) {
            console.error("Failed to parse PDF", error);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];
        if (selected) {
            setFile(selected);
            extractPDFText(selected);
        }
    };

    const handleUpload = async () => {
        if (!pdfText) {
            alert("Must Upload a PDF");
            return;
        }
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:5000/process-text", { extractedText: pdfText });
            setData(response.data.extractedData);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failef to extract data from the file.");
        }

        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", textAlign: "center", padding: 20 }}>
            <h1>Bank Statement Parser</h1>
            <input type="file" onChange={handleFileChange} accept="application/pdf" />
            <button onClick={handleUpload} style={{ marginLeft: 10 }}>Upload & Extract</button>

            {loading && <p>Processing...</p>}

            {data && (
                <div style={{ marginTop: 20, padding: 20, background: "#1a1a1a" , borderRadius: 25, border: "1px solid rgba(255, 255, 255, 0.1)", boxShadow: "0px 8px 15px rgba(0,0,0,0.3)"}}>
                    <h2>{data["Customer Name"]}</h2>
    
                    <p><strong>Address</strong> {data["Address"]}</p>
                    
                    <div style={{ display: "flex", gap: "40px", marginTop: 20 , justifyContent: "space-around"}}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold" }}>Total ATM Withdrawals</span>
                            <span>${data["Total ATM Withdrawals"]}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontWeight: "bold" }}>Total Deposits</span>
                            <span>${data["Total Deposits"]}</span>
                        </div>
                    </div>
                    <h4 style={{ marginTop: 20, fontSize: "1.2rem"}}>
                        Walmart Purchases
                    </h4>
                    <table style={{width: "100%", marginTop: 10, borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.3)", paddingBottom: 5 }}>Date</th>
                                <th style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.3)", paddingBottom: 5 }}>Category</th>
                                <th style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.3)", paddingBottom: 5 }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data["Walmart Purchases"].map((tx: any, index: number) => (
                                <tr key={index}>
                                    <td style={{ padding: "5px 0" }}>{tx.date}</td>
                                    <td style={{ padding: "5px 0" }}>{tx.description}</td>
                                    <td style={{ padding: "5px 0" }}>${tx.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}

        
        </div>
    );
}
