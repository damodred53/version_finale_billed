/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH } from "../constants/routes.js";

// appel du faux storage contenant des factures spécialement conçues pour les tests
jest.mock("../app/store", () => mockStore)
$.fn.modal = jest.fn(); 

describe("Given I am connected as an employee", () => {

  function initialisationBills(){

     // Création de la page BillsUI sur le navigateur
    document.body.innerHTML = BillsUI({ data: bills })

    //Simuler onNavigate
    const onNavigate = jest.fn(()=>{})

    //Simuler store
    const store = mockStore

    //Création d'un nouvel utilisateur
    const userObj = {
      type:"Employee",
      email:"employee@test.tld",
      password:"employee",
      status:"connected"
    }

    // création d'un nouveau localstorage dans le navigateur pour les tests
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })

    // Utilisation du localstorage pour le stockage de l'utilisateur de test
    window.localStorage.setItem('user', JSON.stringify(userObj))

     // Création d'une nouvelle instance de Bills
    return new Bills({document, onNavigate, store, localStorage })
  }
  
  describe("When I am on Bills Page", () => {
    let theBills
    beforeEach(() =>{
      //appel de la fonction d'initialisation d'une facture en vue de créer l'environnement de test
      theBills = initialisationBills()
    })
  
    test("Then bill icon in vertical layout should be highlighted", async () => {

      // création d'un nouveau localstorage dans le navigateur pour les tests
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // création d'une div et intégration dans la page pour les tests
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      router()

      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // vérification de la classe "active-icon" sur icon-window
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // test à observer attentivement pour les besoins du projet
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When click on eye-icon of a bill", ()=>{
      test("Then render a modal",async()=>{
        
          // Récupération de l'ensemble des icones d'oeil
        const eye_icons = screen.getAllByTestId("icon-eye")
        
        // Interaction avec la première des icônes
        userEvent.click(eye_icons[0])
        
        // Verification si le justificatif est bien présent dans le HTML
        await waitFor(() =>{
          expect($('#modaleFile').find(".modal-body").innerHTML != '').toBe(true)
        })

      })
    })
        
    describe('When click on button "Note de frais"',()=>{
      test('Then handleClickNewBill is called',()=>{

        // Création d'un mock pour la fonction d'appel vers la page pour les nouvelles factures
        const handleClickNewBill = jest.fn(theBills.handleClickNewBill())
        
        // Création et activation d'un listener sur le bouton vers la page newBills
        const button = screen.getByTestId('btn-new-bill')
        button.addEventListener('click', handleClickNewBill)
        userEvent.click(button)
    
        expect(handleClickNewBill).toHaveBeenCalled();

        // Annulation du mock précédemment appliqué
        handleClickNewBill.mockRestore();
      })
    })

    // Test d'intégration -> GET
    describe("When I navigate to Bills Page", () => {
      test("fetches bills from mock API GET", async () => {

        // Utilisation du faux localstorage afin de créer un utilisateur fictif connecté
        localStorage.setItem("user", JSON.stringify({ 
          type:"Employee",
          email:"a@a",
          password:"employee",
          status:"connected"
        }));

        // création d'une div et intégration dans la page pour les tests
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)

        router()

        window.onNavigate(ROUTES_PATH.Bills)

        await waitFor(() => {
          expect(screen.getByText("accepted")).toBeTruthy()
          expect(screen.getAllByText("pending")).toBeTruthy()
          expect(screen.getAllByText("refused")).toBeTruthy()
        })
      })
      
      describe("When an error occurs on API", () => {
        beforeEach(() => {

          // Création d'un espion sur la fonction bills contenu dans le mockstore
          jest.spyOn(mockStore, "bills")

          // création d'un nouveau localstorage dans le navigateur pour les tests
          Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
          )

          // Utilisation du faux localstorage afin de créer un utilisateur fictif connecté
          window.localStorage.setItem('user', JSON.stringify({
            type:"Employee",
            email:"a@a",
            password:"employee",
            status:"connected"
          }))

          // création d'une div et intégration dans la page pour les tests
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.appendChild(root)

          router()
        })
        
        test("fetches bills from an API and fails with 404 message error", async () => {
    
          // Création d'une méthode au mockstore provoquant une erreur 404
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 404"))
              }
            }})


          window.onNavigate(ROUTES_PATH.Bills)
          // utilisation de process pour attendre le prochain roulement de node.js  pour lire la suite du code
          await new Promise(process.nextTick);
          const message = screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()

        })
    
        test("fetches messages from an API and fails with 500 message error", async () => {
    
          // Création d'une méthode au mockstore provoquant une erreur 500, donc une erreur qui viendrait du serveur
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list : () =>  {
                return Promise.reject(new Error("Erreur 500"))
              }
            }})
    
          window.onNavigate(ROUTES_PATH.Bills)
          await new Promise(process.nextTick);
          const message = screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    })
  })
})