using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;
namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class TaxNumber : IValueObject
{
    public string Value { get; private set; }
    public string CountryCode { get; private set; }

    private static readonly Dictionary<string, Regex> VatRegexes = new(StringComparer.OrdinalIgnoreCase)
    {
        { "AT", new Regex(@"^ATU\d{8}$", RegexOptions.Compiled) },                   // Austria
        { "BE", new Regex(@"^BE\d{10}$", RegexOptions.Compiled) },                   // Belgica
        { "BG", new Regex(@"^BG\d{9,10}$", RegexOptions.Compiled) },                 // Bulgaria
        { "HR", new Regex(@"^HR\d{11}$", RegexOptions.Compiled) },                   // Croacia
        { "CY", new Regex(@"^CY\d{8}[A-Za-z]$", RegexOptions.Compiled) },            // Chipre
        { "CZ", new Regex(@"^CZ\d{8,10}$", RegexOptions.Compiled) },                 // Republica checa
        { "DK", new Regex(@"^DK\d{8}$", RegexOptions.Compiled) },                    // Dinamarca
        { "EE", new Regex(@"^EE\d{9}$", RegexOptions.Compiled) },                    // Estonia
        { "FI", new Regex(@"^FI\d{8}$", RegexOptions.Compiled) },                    // Finlandia
        { "FR", new Regex(@"^FR[0-9A-HJ-NP-Z]{2}\d{9}$", RegexOptions.Compiled) },   // França
        { "DE", new Regex(@"^DE\d{9}$", RegexOptions.Compiled) },                    // Alemanha
        { "GR", new Regex(@"^GR\d{9}$", RegexOptions.Compiled) },                    // Greece alt.
        { "HU", new Regex(@"^HU\d{8}$", RegexOptions.Compiled) },                    // Hungria
        { "IE", new Regex(@"^IE(\d{7}[A-Za-z]{1,2}|\d[A-Za-z]\d{5}[A-Za-z])$", RegexOptions.Compiled) }, // Irlanda
        { "IT", new Regex(@"^IT\d{11}$", RegexOptions.Compiled) },                   // Italia
        { "LV", new Regex(@"^LV\d{11}$", RegexOptions.Compiled) },                   // Latvia
        { "LT", new Regex(@"^LT(\d{9}|\d{12})$", RegexOptions.Compiled) },           // Lituania
        { "LU", new Regex(@"^LU\d{8}$", RegexOptions.Compiled) },                    // Luxenburgo
        { "MT", new Regex(@"^MT\d{8}$", RegexOptions.Compiled) },                    // Malta
        { "NL", new Regex(@"^NL\d{9}B\d{2}$", RegexOptions.Compiled) },              // Paisdes Baizos
        { "PL", new Regex(@"^PL\d{10}$", RegexOptions.Compiled) },                   // Polonia
        { "PT", new Regex(@"^PT\d{9}$", RegexOptions.Compiled) },                    // Portugal
        { "RO", new Regex(@"^RO\d{2,10}$", RegexOptions.Compiled) },                 // Romania
        { "SK", new Regex(@"^SK\d{10}$", RegexOptions.Compiled) },                   // Eslovaquia
        { "SI", new Regex(@"^SI\d{8}$", RegexOptions.Compiled) },                    // Eslovenia
        { "ES", new Regex(@"^ES([A-Za-z]\d{8}|\d{8}[A-Za-z]|[A-Za-z]\d{7}[A-Za-z])$", RegexOptions.Compiled) }, // Espanha
        { "SE", new Regex(@"^SE\d{12}$", RegexOptions.Compiled) }                    // Suecia
    };

    protected TaxNumber() { }
    
    public TaxNumber(string taxNumber)
    {
        if (string.IsNullOrWhiteSpace(taxNumber))
            throw new ArgumentException("Tax number cannot be null or empty.", nameof(taxNumber));

        Value = Normalize(taxNumber);
        CountryCode = Value.Length >= 2 ? Value.Substring(0, 2).ToUpperInvariant() : string.Empty;

        Validate();
    }


    // Normaliza formatação

    private static string Normalize(string input)
    {
        return input.Trim().Replace(" ", "").Replace("-", "").ToUpperInvariant();
    }


    /// Valida formate de cada pais
    private void Validate()
    {
        if (CountryCode.Length != 2)
            throw new ArgumentException("Invalid country code in tax number.");

        if (!VatRegexes.TryGetValue(CountryCode, out var regex))
            throw new ArgumentException($"Unsupported country code: {CountryCode}");

        if (!regex.IsMatch(Value))
            throw new ArgumentException($"Invalid {CountryCode} tax number format: {Value}");
    }

    public static TaxNumber FromString(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Tax number cannot be null or empty.", nameof(value));

        return new TaxNumber(value);
    }

    public override string ToString() => Value;

    public static bool TryParse(string? input, out TaxNumber? result)
{
    result = null;

    if (string.IsNullOrWhiteSpace(input))
        return false;

    try
    {
        result = new TaxNumber(input);
        return true;
    }
    catch
    {
        // Any exception means parsing failed
        result = null;
        return false;
    }
}
   
}