# Wprowadź następujące komendy:

cd bingeplan

npm install

npm run dev

# Go to:
 http://localhost:3000

Podczas autoryzacji google calendar pojawi się "Google hasn't verified this app" warning.
Należy kliknąć "Advanced" a następnie Go to BingePlan (unsafe) ponieważ aplikacja nie jest zweryfikowana poprzez google.

plik .env powinien zawierać path do api backendu, na przykład:

BACKEND_API_URL=http://localhost:8000