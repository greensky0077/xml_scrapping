# XML Data Replacer - SAS Contract Processor

A modern Node.js script using fast-xml-parser and qrcode to process Mexican SAS (Sociedad por Acciones Simplificada) XML contracts with data replacement and HTML generation.

## Features

- **Data Replacement**: Replaces personal information (names, RFC, CURP, email) in XML files
- **Signature Removal**: Removes invalidated XML-DSig signature blocks
- **HTML Generation**: Creates a clean, responsive HTML view with embedded QR code
- **QR Code**: Generates base64 PNG QR code for quick access to alternate host URL
- **Modular Design**: Clean, function-based code with lines under 70 characters

## Usage

### Transform XML File
```bash
npm run transform
# or
npm start
# or
npm run build
```

This will:
1. Read `SAS-1.2-202303-585748.xml`
2. Perform all required data replacements (string + structured)
3. Remove signature blocks
4. Save cleaned XML to `dist/contratoSocial.updated.xml`
5. Generate HTML view at `dist/index.html`
6. Create deployment README at `dist/README.md`

### View Results
Open `dist/index.html` in your browser to see the formatted contract information.


## Data Replacements

The script performs the following replacements:

- **Full Name**: JORGE MEDINA GONZALEZ → EDUARDO ROSALES PAZ
- **RFC**: MEGJ640107QSA → ROPE6505115EA
- **CURP**: MEGJ640107HDFDNR07 → ROPE650511HDFSZD07
- **Email**: facturas.jmg@outlook.com → tiskamx@outlook.com
- **Split Fields**: Updates accionistas section with new name components
- **Tramite Key**: Updates claveTramite with new RFC
- **Signatures**: Removes both XML-DSig signature blocks

## HTML View Sections

The generated HTML includes:

1. **Company Information**: Razón social, representante legal, RFC, CURP, email
2. **Address & Activity**: Complete address and business activity
3. **Main Shareholder**: Name, RFC, CURP, and share information
4. **QR Code Access**: Embedded base64 PNG QR code for alternate host URL
5. **Additional Info**: Capital, folio, and other contract details

## Requirements

- Node.js 14.0.0 or higher
- Dependencies: fast-xml-parser, qrcode

## Configuration

### Changing QR Code Target URL

Edit the `CONFIG.QR_TARGET_URL` in `scripts/transform.mjs`:

```javascript
const CONFIG = {
    QR_TARGET_URL: 'https://your-domain.com/contrato/585748',
    // ... other config
};
```

### Environment Variables

Set environment variables for different environments:

```bash
QR_TARGET_URL=https://production-site.com/contrato/585748 npm run transform
```

## License

Eliot
