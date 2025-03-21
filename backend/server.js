require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const app = express();
const port =  5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

app.post("/process-text", async (req, res) => {
    try{
        const { extractedText } = req.body;
        if (!extractedText) return res.status(400).json({ error: "No extracted text provided" });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `You are an expert at extracting financial data from bank statements.
                              Your task is to ONLY extract information found in the provided text.
                              If a required field is missing, return "Unknown" instead of making up data.
                              Always return a valid JSON response with NO extra text, explanations, or formatting such as markdown or code blocks.` 
                },
                { 
                    role: "user", 
                    content: `Extract the following details from this bank statement:
                    - "Customer Name": (Full name of the account holder. If not found, return "Unknown")
                    - "Address": (Full mailing address. If not found, return "Unknown")
                    - "Total Deposits": (Sum of all deposit transactions. If not found, return 0)
                    - "Total ATM Withdrawals": (Sum of all ATM withdrawals. If not found, return 0)
                    - "Walmart Purchases": (List of transactions at Walmart, including date, amount, and description. If none found, return an empty list [])

                    Return ONLY valid JSON. Example output:
                    {
                      "Customer Name": "John Doe",
                      "Address": "123 Main St, Springfield, IL",
                      "Total Deposits": 1500.00,
                      "Total ATM Withdrawals": 500.00,
                      "Walmart Purchases": [
                        { "date": "2024-03-16", "amount": 45.99, "description": "Walmart Grocery" },
                        { "date": "2024-03-18", "amount": 23.50, "description": "Walmart Electronics" }
                      ]
                    }

                    Extract this data ONLY from the text below:
                    
                    \nStatement:\n${extractedText}`
                }
            ],
            temperature: 0
        });

        let structuredData;
        try {
            structuredData = JSON.parse(response.choices[0].message.content.trim());
        } catch (error) {
            console.error("Invalid JSON format:", response.choices[0].message.content);
            return res.status(500).json({ error: "OpenAI returned invalid JSON", rawResponse: response.choices[0].message.content });
        }
        res.json({ extractedData: structuredData });
        
    }
    catch (error){
        console.error("Error processing text:", error);
        res.status(500).json({ error: "Failed to process text" });
    }
});

app.listen(port, () => console.log(`server running on http://localhost:${port}`));