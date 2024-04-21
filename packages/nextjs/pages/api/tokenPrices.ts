// pages/api/tokenPrices.ts
import type { NextApiRequest, NextApiResponse } from "next";

type ApiError = {
  message: string;
};

type ApiResponse = {
  status?: string;
  data?: any; // Define more specifically based on what you expect to receive.
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | ApiError>) {
  const { tokenSymbols } = req.query; // Get the id from query parameters
  if (!tokenSymbols || tokenSymbols.length === 0) {
    res.status(400).json({ message: "No token symbols provided" });
    return;
  }

  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tokenSymbols}`;
  const apiKey = process.env.NEXT_PUBLIC_CMC_API_KEY || ""; // Default to an empty string if undefined

  // Check if apiKey is present
  if (!apiKey) {
    res.status(500).json({ message: "API key is not properly configured." });
    return;
  }

  const headers: HeadersInit = {
    "X-CMC_PRO_API_KEY": apiKey,
    Accept: "application/json",
  };

  try {
    const apiRes = await fetch(url, {
      headers,
    });

    if (!apiRes.ok) {
      throw new Error(`HTTP error! Status: ${apiRes.status}`);
    }

    const data: ApiResponse = await apiRes.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch data" });
  }
}
