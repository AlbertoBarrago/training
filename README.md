💪 Piano Allenamento - Tracker
==============================

🚀 Panoramica del Progetto
--------------------------

Questo è un **Web Application Tracker** per piani di allenamento personalizzati, sviluppato interamente in **HTML, CSS e JavaScript Vanilla**. Utilizza la tecnologia **IndexedDB** per la persistenza dei dati e **localStorage** per la gestione delle sessioni utente, consentendo il tracciamento dei progressi degli esercizi e delle statistiche individuali, anche in un contesto multi-utente.

✨ Caratteristiche Principali
----------------------------

*   **Autenticazione Utente:** Sistema di accesso e registrazione utente gestito localmente tramite IndexedDB.
    
*   **Persistenza Dati:** Tracciamento del completamento degli esercizi salvato individualmente per ciascun utente nel database locale (IndexedDB).
    
*   **Statistiche Dinamiche:** Calcolo in tempo reale degli esercizi completati oggi, nell'ultima settimana e in totale, filtrate per l'utente loggato.
    
*   **Interfaccia Responsiva:** Design pulito e moderno ottimizzato per dispositivi desktop e mobili (attraverso CSS media queries).
    
*   **Gestione dello Stato:** Utilizzo del pattern **async/await** per gestire in modo robusto le operazioni asincrone di lettura/scrittura di IndexedDB.
    

⚙️ Struttura Tecnologica
------------------------

**ComponenteRuoloDettagliFrontend**Interfaccia UtenteHTML5, CSS3, Layout flessibile.**Logica**Gestione dello StatoJavaScript ES6+ (Vanilla).**Database**Persistenza Dati**IndexedDB** per dati utente e tracciamento esercizi.**Sessione**Autenticazione**localStorage** per memorizzare l'utente corrente.

📦 Come Avviare il Progetto
---------------------------

Il progetto è una singola pagina HTML e non richiede un server backend.

1.  **Clona o scarica** il file index.html.
    
2.  **Apri** index.html direttamente nel tuo browser (Chrome/Firefox consigliati).
    
3.  Per assicurare il corretto funzionamento di **IndexedDB** in fase di sviluppo (soprattutto se riscontri errori di indici), è consigliabile **cancellare il database precedente** (chiamato WorkoutTrackerDB) nella sezione "Application" degli strumenti per sviluppatori del browser.
    

📝 Note per lo Sviluppo
-----------------------

*   **Sicurezza:** La "hash" della password (btoa()) è puramente dimostrativa. **Non** è adatta per ambienti di produzione reali.
    
*   **Debugging:** Se si verificano errori NotFoundError: index not found, è necessario incrementare la versione del database in indexedDB.open(DB\_NAME, VERSIONE\_NUOVA) e pulire il vecchio database nel browser.
