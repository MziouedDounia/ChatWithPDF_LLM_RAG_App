import time
from lingua import Language, LanguageDetectorBuilder
import langid
from langdetect import detect as langdetect_detect

def test_detection(text, expected_lang):
    # Lingua
    lingua_detector = LanguageDetectorBuilder.from_all_languages().build()
    start = time.time()
    lingua_result = lingua_detector.detect_language_of(text)
    lingua_time = time.time() - start
    lingua_lang = lingua_result.iso_code_639_1.name.lower() if lingua_result else 'unknown'

    # langid
    start = time.time()
    langid_lang, _ = langid.classify(text)
    langid_time = time.time() - start

    # langdetect
    start = time.time()
    try:
        langdetect_lang = langdetect_detect(text)
    except:
        langdetect_lang = 'unknown'
    langdetect_time = time.time() - start

    print(f"Expected: {expected_lang}")
    print(f"Lingua: {lingua_lang} (time: {lingua_time:.4f}s)")
    print(f"langid: {langid_lang} (time: {langid_time:.4f}s)")
    print(f"langdetect: {langdetect_lang} (time: {langdetect_time:.4f}s)")
    print()

# Test texts
texts = {
    'fr': [
        "Bonjour",
        "Comment allez-vous aujourd'hui ?",
        "Le petit chat est assis sur le tapis et regarde par la fenêtre. Il observe les oiseaux qui volent dans le ciel bleu."
    ],
    'ar': [
        "مرحبا",
        "كيف حالك اليوم؟",
        "القطة الصغيرة تجلس على السجادة وتنظر من النافذة. إنها تراقب الطيور التي تطير في السماء الزرقاء."
    ],
    'es': [
        "Hola",
        "¿Cómo estás hoy?",
        "El gatito está sentado en la alfombra y mira por la ventana. Observa los pájaros que vuelan en el cielo azul."
    ],
    'it': [
        "Ciao",
        "Come stai oggi?",
        "Il gattino è seduto sul tappeto e guarda fuori dalla finestra. Osserva gli uccelli che volano nel cielo blu."
    ],
    'de': [
        "Hallo",
        "Wie geht es dir heute?",
        "Die kleine Katze sitzt auf dem Teppich und schaut aus dem Fenster. Sie beobachtet die Vögel, die am blauen Himmel fliegen."
    ]
}

for lang, sentences in texts.items():
    print(f"Testing {lang.upper()}:")
    for text in sentences:
        test_detection(text, lang)
    print("-" * 50)