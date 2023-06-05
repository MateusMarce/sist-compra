import { Field } from "formik"


function PaymentCard({nome, saldo, keyK, setPaymentCheck, paymentCheck, avulsa, pagador}:any) {

  const handleCheckPay = () => {
    setPaymentCheck(keyK)
  }

  return (
    <div className="div-btn-input" title={nome} key={keyK} style={{position:'relative', width:'25%'}}>
      <label htmlFor={nome} className='btn-input-label'>
        {nome === 'Dinheiro' && <i className="bi bi-cash-stack d-flex justify-content-center fs-1"></i>}
        {nome === 'PIX' && <i className="bi bi-qr-code d-flex justify-content-center fs-1"></i>}
        {nome === 'Conta' && <i className="bi bi-wallet2 d-flex justify-content-center fs-1"></i>}
        {nome === 'Saldo' && <i className="bi bi-credit-card d-flex justify-content-center fs-1"></i>}
        <span className={`d-flex row justify-content-center ${!!saldo && Number(saldo) <= 0 && nome == 'Saldo' ? '' : 'mt-2'} mb-0 fw-bold`}>
          {nome}
          {!!saldo && Number(saldo) <= 0 && nome == 'Saldo' &&
            <span style={{fontSize:12, textAlign:'center'}}>*saldo insuf.</span>
          }
        </span>
      </label>
      <Field
        type="radio"
        name='radio'
        className='btn-input'
        id={nome}
        onChange={handleCheckPay}
        value={keyK}
        disabled={(nome != 'Dinheiro' && nome != 'PIX' && avulsa) || (nome == 'Saldo' && Number(saldo) <= 0 && pagador) || (nome == 'Conta' && Number(saldo) > 0 && pagador)}
        checked={paymentCheck === keyK}
      />
    </div>
  )
}

export default PaymentCard