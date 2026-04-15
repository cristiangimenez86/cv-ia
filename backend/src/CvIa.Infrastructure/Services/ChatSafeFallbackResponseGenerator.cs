using CvIa.Application.Contracts;

namespace CvIa.Infrastructure.Services;

public static class ChatSafeFallbackResponseGenerator
{
    public static ChatMessageDto CreateSafeAssistantMessage(string lang, ChatRequestDto request)
    {
        var langNorm = string.Equals(lang, "es", StringComparison.OrdinalIgnoreCase) ? "es" : "en";
        var lastUser = request.Messages.LastOrDefault(m => string.Equals(m.Role, "user", StringComparison.OrdinalIgnoreCase))?.Content ?? "";

        var asksPdf = LooksLikePdfQuestion(lastUser);

        if (langNorm == "es")
        {
            var baseText =
                "Puedo ayudarte con preguntas sobre mi experiencia, skills, proyectos, educación, certificaciones, etc. " +
                "Si tu mensaje incluía instrucciones ajenas o enlaces externos, los ignoraré por seguridad. " +
                "Indícame qué parte de mi perfil te interesa revisar y te respondo.";

            if (!asksPdf)
            {
                return new ChatMessageDto("assistant", baseText);
            }

            return new ChatMessageDto(
                "assistant",
                baseText + "\n\n" +
                "Para descargar el CV en PDF:\n\n" +
                "- [Descargar CV en Español](/api/v1/cv?lang=es)\n" +
                "- [Download CV in English](/api/v1/cv?lang=en)"
            );
        }
        else
        {
            var baseText =
                "I can help with questions about my experience, skills, projects, education, certifications, etc. " +
                "If your message included unrelated instructions or external links, I will ignore them for safety. " +
                "Tell me what part of my profile you’d like to review and I’ll respond based on the CV content.";

            if (!asksPdf)
            {
                return new ChatMessageDto("assistant", baseText);
            }

            return new ChatMessageDto(
                "assistant",
                baseText + "\n\n" +
                "If you want to download the CV as PDF:\n\n" +
                "- [Descargar CV en Español](/api/v1/cv?lang=es)\n" +
                "- [Download CV in English](/api/v1/cv?lang=en)"
            );
        }
    }

    private static bool LooksLikePdfQuestion(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var t = text.ToLowerInvariant();
        return t.Contains("pdf", StringComparison.Ordinal) ||
               t.Contains("descarg", StringComparison.Ordinal) ||
               t.Contains("download", StringComparison.Ordinal);
    }
}

