console.log('>[content] Extension is running...')



let state = {
    dateFrom: '2020-01-01',
    dateTo: '2020-12-31',
    yupeeData: {},
    filteredBy: {
        categories: []
    },
    linhasFiltered: {},
    periods: [],
    categories: [],
    pivotData: []

}


const agentAddCheckbox = setInterval(() => {
    const menu = document.querySelector('#ymain > div > ol')

    if (menu) {
        clearInterval(agentAddCheckbox)
        menu.innerHTML += '<input id="customReport" type="checkbox" class="pull-right">'

        const checkbox = document.querySelector('#customReport')       

        checkbox.addEventListener('click', toogleReport)
    }
}, 200)



const agentReportElements = setInterval(() => {
    const divRelatorios = document.querySelector('#divRelatorios')

    if (divRelatorios) {        
        clearInterval(agentReportElements)

        const div = document.querySelector('#ymain > div')

        const YR_container = document.createElement('div')
        YR_container.id = 'YR_container'
        YR_container.innerHTML = `
            <div id="YR_header">            
                <input type="date" id="dateFrom" value=${state.dateFrom}>
                <input type="date" id="dateTo" value=${state.dateTo}>
    
                <button id="btnRunReport">Executar</button>
            </div>
            
            <div id="YR_chart">
            </div>

            <div id="YR_result">
            </div>

        `
        div.appendChild(YR_container)        

        const btnRunReport = document.querySelector('#btnRunReport')
        btnRunReport.addEventListener('click', runReport)

        const inputFromDate = document.querySelector('#dateFrom')
        inputFromDate.addEventListener('change', handleInputChange)
        
        const inputToDate = document.querySelector('#dateTo')
        inputToDate.addEventListener('change', handleInputChange)
    }

}, 200)


function handleInputChange(event){

    const setValue = {
        dateFrom: (event) => state.dateFrom = event.target.value,
        dateTo: (event) => state.dateTo = event.target.value
    }    

    setValue[event.target.id](event)    
    console.log(state)
}



async function getYupeeData(){
    console.log('>> exec run report')

    const api = axios.create({
        baseURL: 'https://seguro.yupee.com.br/api'
    })

    const dateFrom = state.dateFrom.substring(8,10)+state.dateFrom.substring(5,7)+state.dateFrom.substring(0,4)
    const dateTo = state.dateTo.substring(8,10)+state.dateTo.substring(5,7)+state.dateTo.substring(0,4)

    state.yupeeData = await api.get(`/relatorio/periodo/${dateFrom}/${dateTo}`)
}


function filterYupeeData(){
    state.linhasFiltered = state.yupeeData.data.linhas.sort((a , b) => a.data - b.data)
}



function getPeriods(){
    state.periods = []

    state.linhasFiltered.forEach(linha => {
        if(!state.periods.includes(linha.mesAno)){
            state.periods.push(linha.mesAno)
        }
    })    
}


function getCategories(){
    state.categories = []

    state.linhasFiltered.forEach(linha => {
        if(!state.categories.includes(linha.categoria)){
            state.categories.push(linha.categoria)
        }
    })

    state.categories.sort()
}


function mountPivotData(){    
    
    state.pivotData = []    

    state.linhasFiltered.forEach((linha)=>{
        
        const existInPivot = state.pivotData.find( reg => reg.period == linha.mesAno && reg.category == linha.categoria )
        
        if (existInPivot) {
            existInPivot.value += linha.valor
        } else {
            state.pivotData.push({
                period: linha.mesAno,
                category: linha.categoria,
                value: linha.valor
            })
        }        
    })
}



function mountReportTable(){
    const div = document.querySelector('#YR_result')

    div.innerHTML = `
        <table style="width:100%">
            <tr>
                <th>Categorias</th>
            </tr>
        </table>
    `


    const tr = document.querySelector('#YR_result table tr')

    state.periods.forEach((period)=>{
        tr.innerHTML += `<th>${period}</th>`
    })



    const table = document.querySelector('#YR_result table')    

    state.categories.forEach(ctg => {

        let newTr = `<tr><td>${ctg}</td>`

        state.periods.forEach(per => {
            const register = state.pivotData.find(reg => reg.category == ctg && reg.period == per)

            newTr += `<td>
                ${register ? register.value.toFixed(2) : '0.00'}
                </td>
            `
        })

        table.innerHTML += `${newTr}</tr>`
    })
}

function mountChart(){
    const YR_chart = document.querySelector('#YR_chart')

    console.log('> [mountChart] ')

    let series = []
    let serie = ['', 0]

    state.pivotData.forEach(reg => {
    
        if (serie[0] != reg.period) {
            series.push([serie[0], serie[1]])
            serie[0] = reg.period
            serie[1] = 0
        }       

        serie[1] += reg.value

    })

    series.push([serie[0], serie[1]])
    series.splice(0,1)

    console.log(series)

    console.log(JSON.stringify(series))




    zingchart.render({
        id: 'YR_chart',
        data: {
            type: "line",
            series: [
                { values: series},
                //{ values: series},
            ]
        }
    })


}



async function runReport(){    
    await getYupeeData()
    filterYupeeData()
    getPeriods()
    getCategories()
    mountPivotData()
    mountReportTable()
    mountChart()
    
    //console.clear()
    console.log('>>> STATE OBJ')
    console.log(state)
}






function toogleReport(){
    const checkbox = document.querySelector('#customReport')
    const divRelatorios = document.querySelector('#divRelatorios')
    const YR_container = document.querySelector('#YR_container')

    divRelatorios.style.display = checkbox.checked ? 'none' : 'block'
    YR_container.style.display = checkbox.checked ? 'block' : 'none'
}
