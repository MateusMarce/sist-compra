import { formatValue } from 'react-currency-input-field'
import CurrencyInput from 'react-currency-masked-input'
import { useState, useEffect } from 'react'
import axios from '../api/axios'
import { toast } from 'react-toastify'
import { servicos } from '../assets/types/type'

function ModalEnd({
  setEnd, 
  mode, 
  list, 
  total,
  pagador,
  setServicosCart, 
  setPaymentCheck,
  formikForm,
  setPagador,
  setOptionsUser,
  saldo,
  setSaldo,
  setPagadorName,
  setAvulsa
}:any) {
    const [troco, setTroco] = useState<string>('')
    const [qr, setQr] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [pago, setPago] = useState<boolean>(false)
    const [cancelado, setCancelado] = useState<boolean>(false)
    const [timer, setTimer] = useState<number | undefined>()
    var pay: string = 'PIX'
    switch (mode) {
        case 0:
            pay = 'Dinheiro'
            break
        case 1:
            pay = `Saldo | ${formatValue({value: (saldo).toString(), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}`
            break
        case 2:
            pay = 'PIX'
            break
        case 3:
            pay = 'Conta'
    }
    const apoio_user = {
      usuario_id:pagador.usuario_id,
      cliente_id:pagador.cliente_id,
      aluno_id:pagador.aluno_id,
      dt_compra: pagador.data,
      vl_recibo: Number(total),
      vl_dinheiro: parseFloat(troco?.replaceAll(',','.')) || Number(total),
      vl_troco: troco ? parseFloat(troco?.replaceAll(',','.')) - (Number(total)) : 0,
      itens: list && list.map((i:any,k:number)=>{return {
        produto_id: i.id,
        valor: Number(i.preco_venda),
        valor_custo: Number(i.valor_custo || 0),
        qtd: i.qtd
      }}),
      flag: 'Paga',
      pagamento: (mode + 1).toString()
    }

    let date = new Date()
    let year = date.toLocaleString("default", { year: "numeric" })
    let month = date.toLocaleString("default", { month: "2-digit" })
    let day = date.toLocaleString("default", { day: "2-digit" })
    let hours = date.toLocaleString("default", { hour: "2-digit" })
    let minutes = date.toLocaleString("pt-br", { minute: "2-digit" })

    if (parseInt(minutes) < 10) minutes = `0${minutes}`

    const handleClickFinalizar = async () => {

      try {
        await axios.post('salvarCarrinho', apoio_user)
        toast.success('Venda finalizada com sucesso!', {autoClose:2000})
        let {data} = await axios.get(`getAlunos`)
        let opt = [...data].map(user => ({value:{...user}, label:`${user.nome} ${Number(user.saldo) != 0 && `- Saldo: R$ ${user.saldo}`}`}))
        setOptionsUser(opt)
      } catch (error) {
        
      }

      
      setEnd(false)
      setPagador({
        data: `${year}-${month}-${day}T${hours}:${minutes}`,
        aluno_id: 0,
        cliente_id:'',
        pagamento:1
      })
      setPagadorName('Compra Avulsa')
      setSaldo(0)
      setAvulsa(true)
      setServicosCart([])
      setPaymentCheck(null)
      formikForm.current?.resetForm()
    }
    
    const handleInterval = (txid:string) => {
      if(timer) {
        clearInterval(timer)
        setTimer(0)
      }
      
      const newTimer = window.setInterval(async ()=>{
          
          let res = await axios.post('getPixStatus', {
            txid
          })
          console.log(res.data);
          
          if(res.status == 200) {

            if(res.data == 'Paga') {
              toast.success('Venda realizada com sucesso!')
              setPago(true)
            } else if (res.data == 'Cancelada' ) {
              toast.success('Venda realizada com sucesso!')
              setCancelado(true)
            }
            
            setPagador({
              data: `${year}-${month}-${day}T${hours}:${minutes}`,
              aluno_id: 0,
              cliente_id:'',
              pagamento:1
            })
            setPagadorName('Compra Avulsa')
            setSaldo(0)
            setAvulsa(true)
            setPaymentCheck(null)
            formikForm.current?.resetForm()
            setTimer(0)
            clearInterval(newTimer)
          }
          
      }, 5000)
      
      setTimer(newTimer)
    }

    const handleGenerateQR = async () => {
      setLoading(true)
      let res = await axios.post('getQRCode', apoio_user)
      setQr(res.data.image_base64_img)
      setLoading(false)
      handleInterval(res.data.txid)
    }


    return (
        <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{position:'absolute', top:0, zIndex:999, backgroundColor:'rgba(0,0,0,0.2)'}}>
            <div style={{width:500, backgroundColor:'white'}} className='shadow-lg rounded-3 row py-3' >
                <div className="d-flex pt-2 justify-content-end" style={{height:50}}>
                    <button className="btn btn-white" onClick={()=>{setEnd(false), setTimer(0), clearInterval(timer), setServicosCart([]), setPago(false), setCancelado(false)}}><i className="bi bi-x-lg"></i></button>
                </div>
                <div className="px-4">
                    <div className="row mb-4">
                        {pay == 'PIX' && loading && <i className="bi bi-arrow-clockwise spinner fs-1 d-flex justify-content-center"></i>}
                        {pay == 'PIX' && !loading && qr && pago && 
                          <>
                            <i style={{fontSize:72}} className="bi bi-check d-flex justify-content-center"></i>
                            <span className='text-center fs-4 fw-bolder'>PIX Recebido!</span>
                          </>
                        }
                        {pay == 'PIX' && !loading && qr && cancelado &&
                          <>
                            <i style={{fontSize:72}} className="bi bi-x d-flex justify-content-center"></i>
                            <span className='text-center fs-4 fw-bolder'>Compra Cancelada!</span>
                          </>
                        }
                        {pay == 'PIX' && !loading && qr && !pago && !cancelado && <img style={{height:200, width:'auto', margin:'auto'}} src={qr} />}
                        {pay == 'Dinheiro' && <i className="bi bi-cash-stack fs-1 d-flex justify-content-center"></i>}
                        {pay == 'Conta' && <i className="bi bi-wallet2 fs-1 d-flex justify-content-center"></i>}
                        {pay.split(' |')[0] == 'Saldo' && <i className="bi bi-credit-card d-flex justify-content-center fs-1"></i>}
                        
                        <h5 className="d-flex justify-content-center mt-3" style={{fontSize:18}}>Pagamento {mode === 1 ? 'em': 'por'} {pay}</h5>
                        <h4 className="d-flex justify-content-center" style={{fontSize:30}}>{formatValue({value: total, groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</h4>
                    </div>
                    <div className="d-flex justify-content-between border-bottom mb-2">
                        {/* <p className="mb-1">{pagador.nome}</p> */}
                        <p className="mb-1">{`${day}/${month}/${year} ${hours}:${minutes}`}</p>
                    </div>
                    <div className="d-flex col-sm-12">
                        <p className="col-sm-1">#</p>
                        <p style={{flex:1}}>Item</p>
                        <p className="col-sm-1 text-center">Qtd</p>
                        <p className="col-sm-3 text-end">Subtotal</p>
                    </div>
                    {list.map((i:servicos,k:number)=>(
                        <div className="d-flex col-sm-12" key={k}>
                            <p className="col-sm-1 mb-0" style={{fontSize:14}}>{k+1}</p>
                            <p style={{flex:1, margin:0, fontSize:14}}>{i.nome}</p>
                            <p className="col-sm-1 mb-0 text-center">{i.qtd}</p>
                            <p className="col-sm-3 mb-1 text-end">R$ {formatValue({value:(Number(i.preco_venda) * Number(i.qtd)).toString(), groupSeparator: '.', decimalSeparator: ',', decimalScale: 2})}</p>
                        </div>
                    ))}
                    <div className="d-flex justify-content-between mt-2 border-bottom pb-2">
                        <p className="m-0">TOTAL ITEM</p>
                        <p className="m-0">{formatValue({value: total.toString(), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ '})}</p>
                    </div>
                    <div className="mt-2">
                        {pay.split(' |')[0] == 'Saldo' &&
                          <>
                            <div className={`d-flex justify-content-between mb-2`}>
                                <p className="m-0">SALDO TOTAL</p>
                                <p className="m-0">{formatValue({value: (saldo - Number(total)).toFixed(2), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</p>
                            </div>
                          </>
                        }
                        {pay == 'Conta' &&
                          <>
                            <div className="d-flex justify-content-between mt-2">
                                <p className="m-0">SALDO</p>
                                <p className="m-0">{formatValue({value: saldo.toString(), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</p>
                            </div>
                            <div className="d-flex justify-content-between my-2">
                                <p className="m-0">ITENS</p>
                                <p className="m-0">{formatValue({value: total.toString(), groupSeparator: '.', decimalSeparator: ',', prefix: '-R$ '})}</p>
                            </div>
                            <div className={`d-flex justify-content-between mb-2`}>
                                <p className="m-0">SALDO TOTAL</p>
                                <p className="m-0">{formatValue({value: (saldo - Number(total)).toFixed(2), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</p>
                            </div>
                          </>
                        }
                    </div>


                    {pay == 'Dinheiro' &&
                      <>
                        {/* <div className={`d-flex justify-content-between mt-2 pt-2 border-top`}>
                            <p className="d-flex align-items-center mb-0">SALDO ATUAL</p>
                            <p className="d-flex align-items-center mb-0">{formatValue({value: saldo.toString(), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</p>
                        </div> */}
                        <div className="d-flex justify-content-between mt-2 align-items-center ">
                            <p className="m-0">DINHEIRO</p>
                            <div className="d-flex col-sm-3">
                                <CurrencyInput
                                  name="myInput"
                                  required
                                  type="text"
                                  separator=','
                                  className='ms-2 form-control form-control-borderless text-end px-0 border-bottom rounded-0 py-1'
                                  onChange={(e: any, b: any) => setTroco(b)}
                                  value={troco}
                                  autoFocus={true}
                                />
                            </div>
                        </div>
                        <div className={`d-flex justify-content-between mt-2 mb-2 ${(parseFloat(troco?.replaceAll(',','.') || '0') - (total)) < 0 ? 'total-dev px-2 py-1 rounded-3' : 'total-cre px-2 py-1 rounded-3'} `}>
                            <p className="d-flex align-items-center mb-0">TROCO</p>
                            <p className="d-flex align-items-center mb-0">{formatValue({value: (parseFloat(troco?.replaceAll(',','.') || '0') - (Number(total))).toFixed(2), groupSeparator: '.', decimalSeparator: ',', prefix: 'R$ ', decimalScale: 2})}</p>
                        </div>
                      </>
                    }
                </div>

                {/* botao */}
                <div>
                  {(pay == 'PIX') && <button
                    className="btn-original rounded mx-2 text-white mt-2 py-3"
                    style={{width:'calc(100% - 1rem)'}}
                    onClick={!qr && (!pago || !cancelado) ? handleGenerateQR : ()=>{setEnd(false), setTimer(0), clearInterval(timer), setServicosCart([]), setPago(false), setCancelado(false)}}
                  >
                      {!qr && (!pago || !cancelado) ? "GERAR QR CODE" : 'CONCLUIR COMPRA'}
                  </button>}

                  {(pay.split(' |')[0] == 'Saldo' || pay.split(' |')[0] == 'Conta') && <button
                    className="btn-original rounded mx-2 text-white mt-2 py-3"
                    style={{width:'calc(100% - 1rem)'}}
                    onClick={handleClickFinalizar}
                  >
                      CONCLUIR COMPRA
                  </button>}

                  {pay.split(' |')[0] == 'Dinheiro' && <button
                    className="btn-original rounded mx-2 text-white mt-2 py-3"
                    style={{width:'calc(100% - 1rem)'}}
                    onClick={handleClickFinalizar}
                    disabled={(parseFloat(troco.replace(',','.') || '0') - Number(total)) < 0}
                  >
                    CONCLUIR COMPRA
                  </button>}
                </div>
            </div>
        </div>
    )
}

export default ModalEnd