import express from 'express';

const router = express.Router();

const EU_COUNTRIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];

const VAT_RATES = {
  AT:[20,13,10,0], BE:[21,12,6,0], BG:[20,9,0], HR:[25,13,5,0], CY:[19,9,5,0],
  CZ:[21,15,10,0], DK:[25,0], EE:[22,9,0], FI:[24,14,10,0], FR:[20,10,5.5,2.1,0],
  DE:[19,7,0], GR:[24,13,6,0], HU:[27,18,5,0], IE:[23,13.5,9,4.8,0],
  IT:[22,10,5,4,0], LV:[21,12,5,0], LT:[21,9,5,0], LU:[17,14,8,3,0],
  MT:[18,7,5,0], NL:[21,9,0], PL:[23,8,5,0], PT:[23,13,6,0], RO:[19,9,5,0],
  SK:[20,10,0], SI:[22,9.5,5,0], ES:[21,10,4,0], SE:[25,12,6,0]
};

async function validateVAT(vatNumber) {
  if (!vatNumber?.trim()) {
    return { status: 'INVALID' };
  }

  const clean = vatNumber.replace(/\s/g, '').toUpperCase();
  const countryCode = clean.substring(0, 2);

  if (!EU_COUNTRIES.includes(countryCode)) {
    return { status: 'INVALID' };
  }

  // TEMPORALMENTE SIN VIES - Solo validación de formato
  // TODO: Reconectar VIES cuando arreglemos certificado SSL
  if (clean.length >= 4) {
    console.log(`VAT ${clean} - VALID (formato correcto, VIES desactivado)`);
    return { status: 'VALID' };
  }
  
  return { status: 'INVALID' };
}

async function analyzeRow(row) {
  const result = {
    ...row,
    risk_level: 'BAJO',
    error_type: null,
    impact_estimate: 0,
    explanation: null
  };

  const sellerCountry = row.seller_country?.toUpperCase();
  const customerCountry = row.customer_country?.toUpperCase();
  const netAmount = parseFloat(row.net_amount) || 0;
  const vatPercent = parseFloat(row.vat_applied_percent);

  const vatIsNull = row.vat_applied_percent === null ||
                    row.vat_applied_percent === '' ||
                    isNaN(vatPercent);

  const isEU = (country) => EU_COUNTRIES.includes(country);
  const isCrossBorder = sellerCountry !== customerCountry;

  let vatValidation = { status: 'INVALID' };
  if (isEU(customerCountry) && row.customer_vat_number?.trim()) {
    vatValidation = await validateVAT(row.customer_vat_number);
  }
  result.vat_status = vatValidation.status;

  // Regla 0
  if (isEU(customerCountry) && vatValidation.status === 'NOT_VERIFIED') {
    result.risk_level = 'MEDIO';
    result.error_type = 'NIF/VAT no verificable en VIES';
    return result;
  }

  // Regla 1
  if (isCrossBorder && isEU(sellerCountry) && isEU(customerCountry) &&
      vatValidation.status === 'VALID' && !vatIsNull && vatPercent > 0) {
    result.risk_level = 'ALTO';
    result.error_type = 'Venta B2B intracomunitaria con IVA aplicado';
    result.impact_estimate = netAmount * (vatPercent / 100);
    return result;
  }

  // Regla 2
  if (isCrossBorder && isEU(sellerCountry) && isEU(customerCountry) &&
      vatValidation.status === 'INVALID' && !vatIsNull && vatPercent === 0) {
    result.risk_level = 'ALTO';
    result.error_type = 'Venta B2C intracomunitaria sin IVA aplicado';
    const standardRate = VAT_RATES[customerCountry]?.[0] || 21;
    result.impact_estimate = netAmount * (standardRate / 100);
    return result;
  }

  // Regla 3
  if (!isEU(customerCountry) && !vatIsNull && vatPercent > 0) {
    result.risk_level = 'ALTO';
    result.error_type = 'IVA aplicado en exportación fuera UE';
    result.impact_estimate = netAmount * (vatPercent / 100);
    return result;
  }

  // Regla 4: Tipo de IVA no reconocido para el país
  if (!vatIsNull && vatPercent > 0 && isEU(customerCountry)) {
    const validRates = VAT_RATES[customerCountry];
    if (validRates && !validRates.includes(vatPercent)) {
      result.risk_level = 'MEDIO';
      result.error_type = 'Porcentaje de IVA no reconocido para el país de destino';
      result.explanation = `El ${vatPercent}% aplicado no coincide con los tipos de IVA vigentes en ${customerCountry}. Tipos válidos: ${validRates.join('%, ')}%`;
      rreturn result;
    }
  }
  
  // Regla 5
  if (sellerCountry === customerCountry && isEU(sellerCountry) &&
      !vatIsNull && vatPercent === 0) {
    result.risk_level = 'MEDIO';
    result.error_type = 'Operación nacional sin IVA aplicado';
    const standardRate = VAT_RATES[sellerCountry]?.[0] || 21;
    result.impact_estimate = netAmount * (standardRate / 100);
    return result;
  }

  return result;
}

router.post('/', async (req, res) => {
  const { rows } = req.body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No data provided or invalid format' });
  }

  try {
    const results = await Promise.all(rows.map(analyzeRow));

    const highRisk = results.filter(r => r.risk_level === 'ALTO').length;
    const mediumRisk = results.filter(r => r.risk_level === 'MEDIO').length;
    const totalImpact = results.reduce((sum, r) => sum + (r.impact_estimate || 0), 0);

    res.json({
      results,
      summary: {
        total_rows: rows.length,
        high_risk: highRisk,
        medium_risk: mediumRisk,
        no_risk: rows.length - highRisk - mediumRisk,
        total_impact: totalImpact
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Error analyzing data' });
  }
});

export default router;
