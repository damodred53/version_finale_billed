import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"
/*import {formatChecker} from '../constants/formatChecker.js'*/

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const fileMain = this.document.querySelector(`input[data-testid="file"]`)
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    console.log(file)
    const filePath = e.target.value.split(/\\/g)
    console.log(filePath)
    const fileName = filePath[filePath.length-1]
    console.log(fileName)

    const splitedfileName = fileName.split('.');
    const fileExtension = splitedfileName[splitedfileName.length-1];
    console.log(fileExtension)
    const isGoodFormat = (fileExtension) => ['jpeg', 'jpg', 'png'].includes(fileExtension);
    const errorMessage = this.document.querySelector('.error_format_paragraph');
    
    /*formatChecker(fileExtension);*/
    errorMessage.style.display = "none"

    if (!isGoodFormat(fileExtension)) {
      errorMessage.style.display = "block";
      fileMain.value = null
      
    } 

    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)
    console.log(formData)
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
  }
  handleSubmit = e => {
    e.preventDefault()
    
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }


    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}