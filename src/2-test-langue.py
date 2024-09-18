import time
from lingua import Language, LanguageDetectorBuilder
import langid
from langdetect import detect as langdetect_detect
from collections import defaultdict

def test_detection(text, expected_lang, stats):
    # Lingua
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

    # Update statistics
    stats['lingua']['time'].append(lingua_time)
    stats['lingua']['correct'] += (lingua_lang == expected_lang)
    stats['langid']['time'].append(langid_time)
    stats['langid']['correct'] += (langid_lang == expected_lang)
    stats['langdetect']['time'].append(langdetect_time)
    stats['langdetect']['correct'] += (langdetect_lang == expected_lang)

def print_statistics(stats, total_tests):
    print("Detection Statistics:")
    for detector, data in stats.items():
        avg_time = sum(data['time']) / len(data['time'])
        accuracy = (data['correct'] / total_tests) * 100
        print(f"{detector.capitalize()}:")
        print(f"  Average time: {avg_time:.4f}s")
        print(f"  Accuracy: {accuracy:.2f}%")
    print()

# Warm-up Lingua
print("Warming up Lingua...")
lingua_detector = LanguageDetectorBuilder.from_all_languages().build()
warm_up_text = "This is a warm-up text to initialize Lingua."
for _ in range(10):
    lingua_detector.detect_language_of(warm_up_text)
print("Warm-up complete.\n")

# Test texts
texts = {
    'af': [
        "Hallo",
        "Hoe gaan dit?",
        "Die kat sit op die mat en kyk uit.",
        "Die klein katjie sit op die mat en kyk by die venster uit. Dit kyk hoe die voëls in die blou lug vlieg."
    ],
    'ar': [
        "أهلاً",
        "كيف حالك؟",
        "القطة تجلس على السجادة وتنظر إلى الخارج.",
        "القطة الصغيرة تجلس على السجادة وتنظر من النافذة. إنها تراقب الطيور التي تطير في السماء الزرقاء."
    ],
    'bg': [
        "Здравей",
        "Как си?",
        "Котката седи на килима и гледа навън.",
        "Малкото коте седи на килима и гледа през прозореца. То наблюдава птиците, които летят в синьото небе."
    ],
    'bn': [
        "হ্যালো",
        "আপনি কেমন আছেন?",
        "বিড়ালটি কার্পেটে বসে বাইরে তাকিয়ে আছে।",
        "ছোট বিড়ালটি কার্পেটে বসে জানালার বাইরে তাকিয়ে আছে। এটি নীল আকাশে উড়ন্ত পাখিগুলিকে পর্যবেক্ষণ করছে।"
    ],
    'ca': [
        "Hola",
        "Com estàs?",
        "El gat està assegut a la catifa i mira cap a fora.",
        "El gatet està assegut a la catifa i mira per la finestra. Observa els ocells que volen pel cel blau."
    ],
    'cs': [
        "Ahoj",
        "Jak se máš?",
        "Kočka sedí na koberci a dívá se ven.",
        "Malá kočka sedí na koberci a dívá se z okna. Sleduje ptáky létající na modré obloze."
    ],
    'cy': [
        "Helo",
        "Sut wyt ti?",
        "Mae'r gath yn eistedd ar y carped ac yn edrych allan.",
        "Mae'r gath fach yn eistedd ar y carped ac yn edrych allan trwy'r ffenestr. Mae'n gwylio'r adar sy'n hedfan yn yr awyr las."
    ],
    'da': [
        "Hej",
        "Hvordan går det?",
        "Katten sidder på tæppet og kigger ud.",
        "Den lille kat sidder på tæppet og kigger ud af vinduet. Den ser på fuglene, der flyver på den blå himmel."
    ],
    'de': [
        "Hallo",
        "Wie geht's?",
        "Die Katze sitzt auf dem Teppich und schaut hinaus.",
        "Die kleine Katze sitzt auf dem Teppich und schaut aus dem Fenster. Sie beobachtet die Vögel, die am blauen Himmel fliegen."
    ],
    'el': [
        "Γεια",
        "Τι κάνεις;",
        "Η γάτα κάθεται στο χαλί και κοιτάζει έξω.",
        "Το μικρό γατάκι κάθεται στο χαλί και κοιτάζει από το παράθυρο. Παρακολουθεί τα πουλιά που πετούν στον γαλάζιο ουρανό."
    ],
    'en': [
        "Hello",
        "How are you?",
        "The cat is sitting on the rug and looking out.",
        "The little cat is sitting on the rug and looking out the window. It is watching the birds flying in the blue sky."
    ],
    'es': [
        "Hola",
        "¿Cómo estás?",
        "El gato está sentado en la alfombra y mira afuera.",
        "El gatito está sentado en la alfombra y mira por la ventana. Observa los pájaros que vuelan en el cielo azul."
    ],
    'et': [
        "Tere",
        "Kuidas läheb?",
        "Kass istub vaibal ja vaatab välja.",
        "Väike kassipoeg istub vaibal ja vaatab aknast välja. Ta jälgib linde, kes lendavad sinises taevas."
    ],
    'fa': [
        "سلام",
        "حالت چطوره؟",
        "گربه روی فرش نشسته و به بیرون نگاه می‌کند.",
        "گربه کوچک روی فرش نشسته و از پنجره بیرون را نگاه می‌کند. او پرندگانی را که در آسمان آبی پرواز می‌کنند تماشا می‌کند."
    ],
    'fi': [
        "Hei",
        "Mitä kuuluu?",
        "Kissa istuu matolla ja katsoo ulos.",
        "Pikku kissa istuu matolla ja katsoo ulos ikkunasta. Se katselee lintuja, jotka lentävät sinisellä taivaalla."
    ],
    'fr': [
        "Salut",
        "Comment ça va ?",
        "Le chat est sur le tapis et regarde dehors.",
        "Le petit chat est assis sur le tapis et regarde par la fenêtre. Il observe les oiseaux qui volent dans le ciel bleu."
    ],
    'gu': [
        "હેલ્લો",
        "તમે કેમ છો?",
        "બિલાડી ગાદલા પર બેસીને બહાર જોઈ રહી છે.",
        "નાનું બિલાડું ગાદલા પર બેસીને બારીમાંથી બહાર જોઈ રહ્યું છે. તે આકાશમાં ઊડતા પક્ષીઓને જોઈ રહ્યું છે."
    ],
    'he': [
        "שלום",
        "מה שלומך?",
        "החתול יושב על השטיח ומסתכל החוצה.",
        "החתלתול יושב על השטיח ומסתכל החוצה מהחלון. הוא צופה בציפורים שעפות בשמים הכחולים."
    ],
    'hi': [
        "नमस्ते",
        "आप कैसे हैं?",
        "बिल्ली कालीन पर बैठी है और बाहर देख रही है।",
        "छोटी बिल्ली कालीन पर बैठी है और खिड़की से बाहर देख रही है। वह नीले आकाश में उड़ते हुए पक्षियों को देख रही है।"
    ],
    'hr': [
        "Bok",
        "Kako si?",
        "Mačka sjedi na tepihu i gleda van.",
        "Mala mačka sjedi na tepihu i gleda kroz prozor. Promatra ptice koje lete na plavom nebu."
    ],
    'hu': [
        "Szia",
        "Hogy vagy?",
        "A macska a szőnyegen ül, és kitekint.",
        "A kis macska a szőnyegen ül és az ablakon néz ki. Figyeli a madarakat, amelyek a kék égen repülnek."
    ],
    'id': [
        "Halo",
        "Apa kabar?",
        "Kucing duduk di atas karpet dan melihat keluar.",
        "Kucing kecil duduk di atas karpet dan melihat keluar dari jendela. Ia mengamati burung-burung yang terbang di langit biru."
    ],
    'it': [
        "Ciao",
        "Come stai?",
        "Il gatto è seduto sul tappeto e guarda fuori.",
        "Il gattino è seduto sul tappeto e guarda fuori dalla finestra. Osserva gli uccelli che volano nel cielo blu."
    ],
    'ja': [
        "こんにちは",
        "お元気ですか？",
        "猫はカーペットの上に座って外を見ています。",
        "小さな猫がカーペットの上に座り、窓の外を見ています。彼は青空を飛ぶ鳥を観察しています。"
    ],
    'kn': [
        "ಹಲೋ",
        "ನೀವು ಹೇಗಿದ್ದೀರಿ?",
        "ಬೆಕ್ಕು ಹಾಸಿನ ಮೇಲೆ ಕುಳಿತು ಹೊರಗೆ ನೋಡುತ್ತಿದೆ.",
        "ಸಣ್ಣ ಬೆಕ್ಕು ಹಾಸಿನ ಮೇಲೆ ಕುಳಿತು ಕಿಟಕಿಯ ದಾರಿ ಹೊರಗೆ ನೋಡುತ್ತಿದೆ. ಅದು ನೀಲಾಕಾಶದಲ್ಲಿ ಹಾರುತ್ತಿರುವ ಹಕ್ಕಿಗಳನ್ನು ಗಮನಿಸುತ್ತಿದೆ."
    ],
    'ko': [
        "안녕하세요",
        "어떻게 지내세요?",
        "고양이가 카펫 위에 앉아 밖을 보고 있어요.",
        "작은 고양이가 카펫 위에 앉아 창문 밖을 보고 있어요. 그는 푸른 하늘을 날아가는 새들을 보고 있어요."
    ],
    'lt': [
        "Labas",
        "Kaip sekasi?",
        "Katė sėdi ant kilimo ir žiūri į lauką.",
        "Maža katė sėdi ant kilimo ir žiūri pro langą. Ji stebi paukščius, skraidančius mėlyname danguje."
    ],
    'lv': [
        "Sveiki",
        "Kā tev iet?",
        "Kaķis sēž uz paklāja un skatās ārā.",
        "Mazais kaķēns sēž uz paklāja un skatās pa logu. Viņš vēro putnus, kas lido zilajās debesīs."
    ],
    'mk': [
        "Здраво",
        "Како си?",
        "Мачката седи на тепихот и гледа надвор.",
        "Малото маче седи на тепихот и гледа низ прозорецот. Ги набљудува птиците што летаат на синьото небо."
    ],
    'ml': [
        "ഹലോ",
        "സുഖമാണോ?",
        "പൂച്ച ചാര്പ്പ് മേൽ ഇരുന്നു പുറത്തേക്ക് നോക്കുന്നു.",
        "ചെറിയ പൂച്ച ചാര്പ്പ് മേൽ ഇരുന്നു ജനാലയിൽ നിന്നും പുറത്തേക്ക് നോക്കുന്നു. ഇത് ആകാശത്ത് പറക്കുന്ന പക്ഷികളെ ശ്രദ്ധിക്കുന്നു."
    ]
}

stats = {
    'lingua': {'time': [], 'correct': 0},
    'langid': {'time': [], 'correct': 0},
    'langdetect': {'time': [], 'correct': 0}
}

total_tests = sum(len(sentences) for sentences in texts.values())

for lang, sentences in texts.items():
    print(f"Testing {lang.upper()}:")
    for text in sentences:
        test_detection(text, lang, stats)
    print("-" * 50)

print_statistics(stats, total_tests)