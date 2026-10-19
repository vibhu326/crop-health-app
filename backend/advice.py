"""General IPM guidance (English + Hindi). No pesticide doses on purpose."""
G = {
 "healthy": {"en": ["No disease detected.", "Keep scouting once a week, including the underside of leaves.", "Maintain balanced irrigation and nutrition."],
  "hi": ["कोई रोग नहीं मिला।", "सप्ताह में एक बार निगरानी करें, पत्तियों की निचली सतह भी देखें।", "संतुलित सिंचाई और पोषण बनाए रखें।"]},
 "fungal": {"en": ["Remove and destroy infected leaves; do not compost them.", "Water at the base in the morning and avoid wetting leaves.", "Improve spacing and airflow; remove weeds nearby.", "Rotate to a non-host crop next season.", "If it keeps spreading, ask your extension officer which fungicide (if any) is approved for your crop and follow the label."],
  "hi": ["संक्रमित पत्तियों को हटाकर नष्ट करें; उनसे खाद न बनाएं।", "सुबह के समय जड़ के पास पानी दें और पत्तियों को गीला होने से बचाएं।", "पौधों के बीच दूरी और हवा का प्रवाह बढ़ाएं; आसपास की खरपतवार हटाएं।", "अगले मौसम में गैर-पोषी फसल के साथ फसल चक्र अपनाएं।", "यदि रोग फैलता रहे तो कृषि विस्तार अधिकारी से पूछें कि आपकी फसल के लिए कौन सा फफूंदनाशक (यदि कोई) अनुमोदित है और लेबल के निर्देश मानें।"]},
 "bacterial": {"en": ["Remove infected plants or leaves and disinfect tools between plants.", "Avoid working in the field when plants are wet.", "Use certified disease-free seed or seedlings.", "Rotate crops; do not plant the same crop family in the same plot next season.", "Ask your extension officer before using any copper-based or other bactericide."],
  "hi": ["संक्रमित पौधे या पत्तियां हटाएं और हर पौधे के बाद औजार कीटाणुरहित करें।", "पौधे गीले हों तब खेत में काम न करें।", "प्रमाणित रोगमुक्त बीज या पौध का उपयोग करें।", "फसल चक्र अपनाएं; अगले मौसम में उसी कुल की फसल उसी खेत में न लगाएं।", "कोई भी कॉपर-आधारित या अन्य जीवाणुनाशक उपयोग करने से पहले कृषि विस्तार अधिकारी से सलाह लें।"]},
 "viral": {"en": ["Uproot and destroy infected plants early to limit spread.", "Control insect vectors such as whiteflies and aphids with yellow sticky traps and locally approved options.", "Remove weeds that can host the virus.", "Use resistant varieties and virus-free seedlings next season.", "Confirm the diagnosis with an extension officer or laboratory."],
  "hi": ["फैलाव रोकने के लिए संक्रमित पौधों को जल्दी उखाड़कर नष्ट करें।", "सफेद मक्खी और माहू जैसे वाहक कीटों को पीले चिपचिपे जाल और स्थानीय रूप से अनुमोदित उपायों से नियंत्रित करें।", "विषाणु के मेजबान खरपतवार हटाएं।", "अगले मौसम में प्रतिरोधी किस्में और विषाणुमुक्त पौध लगाएं।", "कृषि विस्तार अधिकारी या प्रयोगशाला से निदान की पुष्टि कराएं।"]},
 "mite": {"en": ["Check the underside of leaves and isolate heavily affected plants.", "Spray plants with a strong water jet to dislodge mites and reduce dry, dusty stress.", "Encourage natural predators and avoid broad-spectrum sprays.", "Ask your extension officer about an approved miticide only if numbers keep rising."],
  "hi": ["पत्तियों की निचली सतह जांचें और अधिक प्रभावित पौधों को अलग करें।", "माइट हटाने के लिए पौधों पर पानी की तेज धार डालें और सूखे व धूल भरे तनाव को कम करें।", "प्राकृतिक शत्रु कीटों को बढ़ावा दें और व्यापक-प्रभाव वाले छिड़काव से बचें।", "संख्या बढ़ती रहे तभी अनुमोदित माइटनाशक के बारे में कृषि विस्तार अधिकारी से पूछें।"]},
 "default": {"en": ["Isolate the affected plants and avoid spraying until the diagnosis is confirmed.", "Take clear photos of the top and underside of the leaf and refer the case to an extension officer or laboratory.", "Monitor again in 3 to 5 days."],
  "hi": ["प्रभावित पौधों को अलग करें और निदान की पुष्टि होने तक छिड़काव न करें।", "पत्ती के ऊपरी और निचले भाग की साफ फोटो लें और मामला कृषि विस्तार अधिकारी या प्रयोगशाला को भेजें।", "3 से 5 दिन बाद दोबारा निगरानी करें।"]}}
NOTE = {"en": "General integrated pest management guidance only. No pesticide doses are given here; always follow the product label and local extension advice.",
        "hi": "यह केवल सामान्य एकीकृत कीट प्रबंधन मार्गदर्शन है। यहां कीटनाशकों की मात्रा नहीं दी गई है; हमेशा उत्पाद के लेबल और स्थानीय विस्तार सलाह का पालन करें।"}
def group(label):
    l = label.lower()
    if "healthy" in l: return "healthy"
    if "bacterial" in l: return "bacterial"
    if any(w in l for w in ("virus", "mosaic", "curl")): return "viral"
    if any(w in l for w in ("mite", "spider")): return "mite"
    if any(w in l for w in ("blight", "spot", "rust", "mildew", "mold", "scab", "rot", "scorch")): return "fungal"
    return "default"
def advice(label): g = group(label); return {"group": g, "steps": G[g], "note": NOTE}
