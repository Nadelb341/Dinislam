"""
🌟 99 noms d'Allah — fiches ADULTES de Nadia (textes validés par elle, rédigés avec ChatGPT, 27/11/2026).
Outils communs pour écrire les fiches lot par lot. Le texte est repris TEL QUEL : ne rien reformuler, ne rien ajouter.

Une fiche :
  o        numéro dans l'APPLI (display_order) — la correspondance se fait par le NOM, jamais par le numéro de ChatGPT
  s        numéro dans la liste de ChatGPT (décalée d'1 à partir de 67 : l'appli a « 67 Al-Ahad »)
  statut   etabli | divergence | non_etabli   (badges 🟢 Établi / 🟠 Divergence / 🔴 Non établi)
  classement coran | sunna | coran_sunna | discute   (onglets du bouton « Authenticité »)
  sections : liste de blocs ; types : texte, preuve, invocation, prophetique, divergence (encadré repliable), authenticite
Dans les textes : une ligne qui commence par « - » = une puce ; une ligne vide = un nouveau paragraphe.
"""
import textwrap

FP = "Formulation personnelle."
FP_LONG = "Cette formulation est une invocation personnelle, et non une formule prophétique spécifique rapportée."
FP_RAPPEL = "Formulation personnelle, et non invocation prophétique spécifique rapportée."


def _t(x):
    return textwrap.dedent(x).strip() if x else None


def F(o, s, nom_arabe, translit, traduction, provenance, statut, classement, *sections):
    assert statut in ("etabli", "divergence", "non_etabli"), statut
    assert classement in ("coran", "sunna", "coran_sunna", "discute"), classement
    return {"o": o, "s": s, "nom_arabe": nom_arabe, "translit": translit, "traduction": traduction,
            "provenance": provenance, "statut": statut, "classement": classement,
            "sections": [x for x in sections if x]}


def S(titre, texte):
    return {"type": "texte", "titre": titre, "texte": _t(texte)}


def P(titre, arabe=None, traduction=None, ref=None, degre=None, texte=None):
    """Preuve : texte arabe (RTL), traduction du sens, référence, degré (coran / sahih / hasan…), texte libre après."""
    return {"type": "preuve", "titre": titre, "arabe": arabe, "traduction": _t(traduction), "ref": _t(ref),
            "degre": degre, "texte": _t(texte)}


def I(texte, note=FP, titre="Exemple d'invocation"):
    return {"type": "invocation", "titre": titre, "texte": _t(texte), "note": _t(note)}


def PR(titre, arabe=None, phonetique=None, traduction=None, ref=None, degre=None, texte=None, note=None):
    """Invocation prophétique (ou formule coranique) à distinguer de l'invocation personnelle."""
    return {"type": "prophetique", "titre": titre, "arabe": arabe, "phonetique": phonetique, "traduction": _t(traduction),
            "ref": _t(ref), "degre": degre, "texte": _t(texte), "note": _t(note)}


def D(texte, titre="À savoir – Divergence entre les savants"):
    return {"type": "divergence", "titre": titre, "texte": _t(texte)}


def A(badge, texte=None, titre="Authenticité et provenance"):
    return {"type": "authenticite", "titre": titre, "badge": badge, "texte": _t(texte)}
