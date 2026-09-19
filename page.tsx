import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności i ochrony danych osobowych edusmyki.pl",
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#F5A623" }}>Polityka prywatności</h1>
      <p className="text-sm text-gray-500 mb-10">Obowiązuje od 4 września 2026 r.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§1. Administrator danych</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Administratorem danych osobowych Klientów sklepu edusmyki.pl jest Edusmyki Małgorzata Smyk, NIP 8981546948, ul. Wrocławska 29 lok. 7, 57-160 Borów. Kontakt w sprawach dotyczących danych osobowych: <a href="mailto:kontakt@edusmyki.pl" className="text-[#4BBFCA] underline">kontakt@edusmyki.pl</a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§2. Jakie dane zbieramy</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li><strong>Adres e-mail</strong> — niezbędny do realizacji zamówienia i dostarczenia plików.</li>
          <li><strong>Imię i nazwisko</strong> — podawane dobrowolnie przy składaniu zamówienia.</li>
          <li><strong>Adres IP</strong> — rejestrowany przy każdym pobraniu pliku w celach bezpieczeństwa.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§3. Cel i podstawa przetwarzania</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li><strong>Realizacja umowy</strong> (art. 6 ust. 1 lit. b RODO) — dostarczenie zamówionych plików, obsługa płatności, wysyłka potwierdzeń zamówień.</li>
          <li><strong>Prawnie uzasadniony interes</strong> (art. 6 ust. 1 lit. f RODO) — zapobieganie nadużyciom, rejestracja pobrań plików.</li>
          <li><strong>Obowiązki prawne</strong> (art. 6 ust. 1 lit. c RODO) — wystawianie faktur, przechowywanie dokumentacji sprzedaży.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§4. Odbiorcy danych</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">Dane osobowe mogą być przekazywane następującym podmiotom:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li><strong>Stripe Payments Europe, Ltd.</strong> — operator płatności, przetwarza dane niezbędne do realizacji transakcji.</li>
          <li><strong>Resend Inc.</strong> — dostawca usługi wysyłki e-mail (potwierdzenia zamówień, linki do pobrania).</li>
          <li><strong>Railway Corp.</strong> — hosting serwisu, w tym przechowywanie plików PDF (serwery w UE lub USA z odpowiednimi zabezpieczeniami).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§5. Okres przechowywania danych</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li>Dane zamówień przechowywane są przez 5 lat od końca roku kalendarzowego, w którym dokonano zakupu (wymogi podatkowe).</li>
          <li>Dane związane z pobraniami plików (tokeny) przechowywane są przez 30 dni od zakupu.</li>
          <li>Dane konta (jeśli Klient założył konto) — do czasu usunięcia konta na wniosek Klienta.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§6. Prawa przysługujące użytkownikom</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">Na podstawie RODO przysługują Ci następujące prawa:</p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li><strong>Prawo dostępu</strong> — możesz zażądać informacji o przetwarzanych danych.</li>
          <li><strong>Prawo do sprostowania</strong> — możesz żądać poprawienia nieprawidłowych danych.</li>
          <li><strong>Prawo do usunięcia</strong> — możesz żądać usunięcia danych, jeśli nie ma podstawy prawnej do ich przechowywania.</li>
          <li><strong>Prawo do ograniczenia przetwarzania</strong> — możesz żądać ograniczenia przetwarzania w określonych przypadkach.</li>
          <li><strong>Prawo do przenoszenia danych</strong> — możesz otrzymać swoje dane w ustrukturyzowanym formacie.</li>
          <li><strong>Prawo do sprzeciwu</strong> — możesz wnieść sprzeciw wobec przetwarzania opartego na prawnie uzasadnionym interesie.</li>
        </ul>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          Wnioski dotyczące praw kieruj na: <a href="mailto:kontakt@edusmyki.pl" className="text-[#4BBFCA] underline">kontakt@edusmyki.pl</a>. Masz też prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§7. Pliki cookies</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm leading-relaxed">
          <li><strong>Niezbędne</strong> — sesja użytkownika (zalogowanie), koszyk zakupowy. Wymagane do działania serwisu.</li>
          <li><strong>Analityczne</strong> — Google Analytics 4 (jeśli skonfigurowane) uruchamiamy po Twojej zgodzie na statystyki. Służy do pomiaru odwiedzin i korzystania ze sklepu; odbiorcą danych jest Google.</li>
          <li><strong>Marketingowe</strong> — Piksel Meta uruchamiamy po Twojej zgodzie na marketing. Przekazuje Meta informacje o odwiedzinach, adresie strony oraz dane techniczne przeglądarki i urządzenia w celu pomiaru skuteczności reklam. Meta może powiązać te informacje z Twoim kontem w swoich usługach.</li>
        </ul>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          Opcjonalne statystyki i marketing są domyślnie wyłączone. Możesz wybrać „Tylko niezbędne”, zaakceptować wszystkie opcje lub zapisać oddzielny wybór dla statystyk i marketingu. Decyzję zapisujemy w przeglądarce na 180 dni. Zmienisz ją lub wycofasz zgodę przyciskiem „Ustawienia cookies”. Wycofanie zgody powoduje odświeżenie strony i zatrzymanie opcjonalnych narzędzi; nie usuwa danych przekazanych wcześniej. Możesz też usunąć dane witryny w ustawieniach przeglądarki.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">§8. Zmiany polityki</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Zastrzegamy sobie prawo do zmiany niniejszej polityki. Aktualna wersja dostępna jest zawsze pod adresem <a href="/polityka-prywatnosci" className="text-[#4BBFCA] underline">edusmyki.pl/polityka-prywatnosci</a>. O istotnych zmianach poinformujemy drogą e-mailową.
        </p>
      </section>
    </div>
  );
}
