// Import dependencies
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');

// Initialize express app
const app = express();
app.use(bodyParser.json()); // Middleware to parse JSON request bodies

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Add a health-check route to test your deployment
// POST route for /chat
app.post('/chat', async (req, res) => {
  const { totalEnergyConsumption, productNames, powerRatings, hours } = req.body;

  if (
    totalEnergyConsumption === undefined ||
    !productNames ||
    !powerRatings ||
    !hours
  ) {
    return res.status(400).json({ error: 'Incomplete energy data provided' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert energy efficiency consultant with deep knowledge of household appliances and energy optimization. Your task is to analyze energy consumption data and provide detailed, actionable recommendations for reducing energy usage while maintaining comfort and functionality.`
        },
        {
          role: 'user',
          content: `Based on the following energy consumption data, please provide a comprehensive analysis and recommendations:

Energy Consumption Data:
- Total Monthly Energy: ${totalEnergyConsumption} kWh
- Appliances: ${productNames.join(', ')}
- Power Ratings: ${powerRatings.join(', ')} watts
- Daily Usage Hours: ${hours.join(', ')} hours

Please provide recommendations in the following format:

1. High-Impact Changes:
   - Identify the top 3 energy-consuming appliances
   - Suggest specific model upgrades with energy ratings
   - Provide estimated energy savings in kWh and percentage

2. Behavioral Recommendations:
   - List specific usage patterns to optimize for each appliance
   - Include timing recommendations (e.g., off-peak hours)
   - Suggest maintenance practices for optimal efficiency

3. Technology Upgrades:
   - Recommend smart devices or automation options
   - Suggest energy monitoring solutions
   - List compatible energy-efficient accessories

4. Cost Analysis:
   - Calculate potential monthly savings in kWh
   - Estimate annual cost savings
   - Provide payback period for recommended upgrades

5. Environmental Impact:
   - Calculate CO2 reduction potential
   - Estimate water savings (if applicable)
   - List environmental benefits

Please ensure all recommendations are:
- Specific to the provided appliances
- Include actual numbers and calculations
- Consider local climate and usage patterns
- Prioritize cost-effective solutions
- Include both immediate and long-term improvements

Format the response in clear sections with bullet points for easy reading.`
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
      stop: null,
    });

    res.setHeader('Content-Type', 'application/json');
    res.write('{"response": "');

    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content.replace(/"/g, '\\"'));
    }

    res.write('"}');
    res.end();
  } catch (error) {
    console.error('Error occurred:', error);
    res
      .status(500)
      .json({ error: 'Failed to get a response from the model', details: error.message });
  }
});
// Start the server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
