using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VVN.Docs;

public class PdfDocumentCollection
{
    private readonly List<PdfDocument> _pdfs = new();

    public IReadOnlyList<PdfDocument> Pdfs => _pdfs.AsReadOnly();

    public void AddPdf(PdfDocument pdf)
    {
        if (pdf == null)
            throw new BusinessRuleValidationException("PDF cannot be null");

        _pdfs.Add(pdf);
    }

    public bool RemovePdf(string fileName)
    {
        if (string.IsNullOrEmpty(fileName))
            throw new BusinessRuleValidationException("File name cannot be null or empty.");

        var pdf = _pdfs.Find(p => p.FileName.Equals(fileName, StringComparison.OrdinalIgnoreCase));
        if (pdf != null)
        {
            _pdfs.Remove(pdf);
            return true;
        }

        return false;
    }
}