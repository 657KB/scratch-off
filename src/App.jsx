import * as THREE from 'three'
import JSConfetti from 'js-confetti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import './App.css'

const generateNumbers = luckyNumber => {
  const arr = Array.from({ length: 100 }).fill().map((_, i) => i)
  return Array.from({ length: 18 }).fill().map((_, i) => {
    const random = Math.floor(Math.random() * arr.length)
    const num = arr.splice(random, 1)[0]
    if (num === new Date().getDate() && i > 12 && Math.random() > 0.5) {
      return num - 1
    }
    if (num !== luckyNumber || (num === luckyNumber && luckyNumber === random)) {
      return num
    }
    return arr.pop() || 0
  })
}

const toLocalPoint = point => {
  const heightRatio = 512 / 6.656
  const widthRatio = 280 / 3.64
  return { x: point.x * widthRatio + 140, y: point.y * heightRatio + 256 }
}

const getPrizeIndex = (luckyNumber, numbers) => {
  return numbers.map((num, index) => {
    if (num === luckyNumber || num === new Date().getDate()) {
      return index
    }
    return null
  }).filter(v => v !== null)
}

const prize = [
  5, 10, 15, 20, 30, 40,
  50, 100, 150, 200, 250, 300,
  400, 500, 600, 700, 800, 999,
]

function App() {
  // ref
  const container = useRef()
  const lastRAF = useRef(null)
  const isDown = useRef(false)
  const pointer = useRef(new THREE.Vector2())
  const intersectPoints = useRef([])
  const luckyNumber = useRef(Math.floor(Math.random() * 100))
  const numbers = useRef(generateNumbers(luckyNumber.current))
  const prizeIndex = useRef(getPrizeIndex(luckyNumber.current, numbers.current))

  // enviroment
  const scene = useMemo(() => new THREE.Scene(), [])
  const camera = useMemo(() => new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000), [])
  const renderer = useMemo(() => new THREE.WebGLRenderer({ antialias: true }), [])

  // light
  const ambientLight = useMemo(() => new THREE.AmbientLight(0x000000), [])
  const directionalLight = useMemo(() => new THREE.DirectionalLight(0xffffff, 2.4), [])

  // card
  const image = useMemo(() => {
    const img = new Image(280, 512)
    img.src = 'textures/bg.png'
    return img
  }, [])
  const canvas0 = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 280
    c.height = 512
    return c
  }, [])
  const canvas1 = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 280
    c.height = 512
    return c
  }, [])
  const combineCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 280
    c.height = 512
    return c
  }, [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42 }), [])
  const geometry = useMemo(() => new THREE.PlaneGeometry(3.64, 6.656), [])
  const draw = useCallback(() => {
    const ctx1 = canvas1.getContext('2d')
    const combineCtx = combineCanvas.getContext('2d')

    const len = intersectPoints.current.length
    intersectPoints.current.slice(Math.max(0, len - 10), len).forEach(p => {
      const point = toLocalPoint(p)
      const size = window.innerWidth * 0.1
      ctx1.clearRect(point.x, point.y, 20, 20)

      const index = prizeIndex.current.findIndex(i => {
        const x = 34 + Math.trunc(i % 6) * 38
        const y = 312 + Math.trunc(i / 6) * 48
        if (point.x >= x - 20 && point.x <= x + 20 && point.y >= y - 20 && point.y <= y + 20) {
          const jsConfetti = new JSConfetti()
          jsConfetti.addConfetti({
            confettiRadius: 4,
            confettiNumber: 256,
          })
          return true
        }
      })
      if (index !== -1) {
        prizeIndex.current.splice(index, 1)
      }
    })

    combineCtx.drawImage(canvas0, 0, 0)
    combineCtx.drawImage(canvas1, 0, 0)

    material.map = new THREE.CanvasTexture(combineCanvas)
    material.needsUpdate = true
  }, [canvas0, canvas1, combineCanvas, material])
  const card = useMemo(() => {
    const ctx0 = canvas0.getContext('2d')
    const ctx1 = canvas1.getContext('2d')
    const combineCtx = combineCanvas.getContext('2d')

    image.onload = () => {
      ctx0.globalCompositeOperation = 'source-over'
      ctx0.drawImage(image, 0, 0, 280, 512)

      ctx1.fillStyle = '#ccc'
      ctx1.beginPath()
      ctx1.arc(227.5, 238, 28, 0, 2 * Math.PI, false)
      ctx1.fill()
      ctx1.beginPath()
      ctx1.roundRect(20, 287.5, 240, 150, 4)
      ctx1.fill()

      const today = new Date().getDate()

      ctx0.fillStyle = 'white'
      ctx0.font = '36px sans'
      ctx0.fillText(today.toString().padStart(2, '0'), 31, 252)

      ctx0.fillStyle = 'white'
      ctx0.font = '36px sans'
      ctx0.fillText(luckyNumber.current.toString().padStart(2, '0'), 206, 252)

      numbers.current.forEach((num, i) => {
        const x = 34 + Math.trunc(i % 6) * 38
        const y = 312 + Math.trunc(i / 6) * 48
        ctx0.fillStyle = (num === luckyNumber.current || num === today) ? '#ffcc16' : 'white'
        ctx0.font = '16px sans'
        ctx0.fillText(num.toString().padStart(2, '0'), x, y)
        ctx0.fillStyle = (num === luckyNumber.current || num === today) ? '#ffcc16' : 'white'
        ctx0.font = '12px sans'
        ctx0.fillText(`￥${prize[i]}`, x - ctx0.measureText(`￥${prize[i]}`).width / 4, y + 16)
      })

      combineCtx.drawImage(canvas0, 0, 0)
      combineCtx.drawImage(canvas1, 0, 0)
      material.map = new THREE.CanvasTexture(combineCanvas)
      material.needsUpdate = true
    }
    const card = new THREE.Mesh(geometry, material)
    card.name = 'card'
    return card
  }, [geometry, material, draw])

  // state
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [modalVisible, setModalVisible] = useState(false)

  // modal
  const showModal = () => setModalVisible(true)
  const hideModal = () => setModalVisible(false)

  useEffect(() => {
    const initRenderer = () => {
      camera.aspect = window.innerWidth / (window.innerHeight * 0.8)
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(window.innerWidth, (window.innerHeight * 0.8))
      renderer.setClearColor(0, 0)
      if (container.current.children.length === 0) {
        container.current.appendChild(renderer.domElement)
      }
    }
    initRenderer()
    window.addEventListener('resize', initRenderer)
    return () => {
      window.removeEventListener('resize', initRenderer)
    }
  }, [renderer, camera])

  useEffect(() => {
    scene.add(card)
    scene.add(ambientLight)

    directionalLight.position.set(-0.5, 1.2, 2)
    scene.add(directionalLight)
    camera.position.z = 5
  }, [scene, camera, ambientLight, card, directionalLight])

  useEffect(() => {
    const animate = () => {
      lastRAF.current = requestAnimationFrame(animate)

      // card follow pointer
      const targetRotationX = (Math.PI / 16) * Math.max(-1, Math.min(1, mouse.x))
      const targetRotationY = (Math.PI / 36) * Math.max(-1, Math.min(1, mouse.y))
      card.rotation.x += (targetRotationY - card.rotation.x) * 0.1
      card.rotation.y += (targetRotationX - card.rotation.y) * 0.04

      // handle scratch
      const vector = new THREE.Vector3(pointer.current.x, pointer.current.y, 0.5).unproject(camera)
      const raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize())
      const intersects = raycaster.intersectObjects(scene.children)
      if (intersects.length > 0 && isDown.current) {
        if (intersects.find(({ object }) => object.name === 'card')) {
          intersectPoints.current.push(intersects[0].point)
          draw()
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      if (lastRAF.current !== null) {
        cancelAnimationFrame(lastRAF.current)
      }
    }
  }, [scene, camera, mouse, material, card, draw])

  useEffect(() => {
    const mouseHandler = event => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / (window.innerHeight * 0.8)) * 2 - 1,
      })
    }
    const touchHandler = event => {
      setMouse({
        x: (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1,
        y: (event.changedTouches[0].clientY / (window.innerHeight * 0.8)) * 2 - 1
      })
    }
    const endHandler = () => setMouse({ x: 0, y: 0 })
    container.current.addEventListener('mousemove', mouseHandler)
    container.current.addEventListener('mouseup', endHandler)
    container.current.addEventListener('mouseleave', endHandler)
    container.current.addEventListener('touchmove', touchHandler)
    container.current.addEventListener('touchend', endHandler)
    container.current.addEventListener('touchcancel', endHandler)
    return () => {
      container.current.removeEventListener('mousemove', mouseHandler)
      container.current.removeEventListener('mouseup', endHandler)
      container.current.removeEventListener('mouseleave', endHandler)
      container.current.removeEventListener('touchmove', touchHandler)
      container.current.removeEventListener('touchend', endHandler)
      container.current.removeEventListener('touchcancel', endHandler)
    }
  }, [])

  useEffect(() => {
    const mouseMoveHandler = event => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / (window.innerHeight * 0.8)) * 2 - 1
    }
    const mouseDownHandler = event => {
      isDown.current = true
      mouseMoveHandler(event)
    }
    const mouseUpHandler = event => {
      isDown.current = false
      mouseMoveHandler(event)
    }
    const touchMoveHandler = event => {
      pointer.current.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.changedTouches[0].clientY / (window.innerHeight * 0.8)) * 2 - 1
    }
    const touchStartHandler = event => {
      isDown.current = true
      touchMoveHandler(event)
    }
    const touchEndHandler = event => {
      isDown.current = false
      touchMoveHandler(event)
    }
    container.current.addEventListener('mousedown', mouseDownHandler)
    container.current.addEventListener('mousemove', mouseMoveHandler)
    container.current.addEventListener('mouseup', mouseUpHandler)
    container.current.addEventListener('mouseleave', mouseUpHandler)
    container.current.addEventListener('touchstart', touchStartHandler)
    container.current.addEventListener('touchmove', touchMoveHandler)
    container.current.addEventListener('touchend', touchEndHandler)
    container.current.addEventListener('touchcancel', touchEndHandler)
    return () => {
      container.current.removeEventListener('mousedown', mouseDownHandler)
      container.current.removeEventListener('mousemove', mouseMoveHandler)
      container.current.removeEventListener('mouseup', mouseUpHandler)
      container.current.removeEventListener('mouseleave', mouseUpHandler)
      container.current.removeEventListener('touchstart', touchStartHandler)
      container.current.removeEventListener('touchmove', touchMoveHandler)
      container.current.removeEventListener('touchend', touchEndHandler)
      container.current.removeEventListener('touchcancel', touchEndHandler)
    }
  }, [])

  const modal = (
    <div className='modal' data-visible={`${modalVisible}`} onClick={hideModal}>
      <p>我还年轻，不想踩缝纫机</p>
      <p>你领个红包吧👀</p>
      <img src='/qrcode.jpg' />
      <p>点击任意处关闭</p>
    </div>
  )

  return (
    <div className='main'>
      <div className='container' ref={container} />
      <div className='menu'>
        <button className='button' onClick={() => location.reload()}>再刮一张</button>
        <div className='scan'>
          <span onClick={showModal} href='mailto:kuyermqi@outlook.com'>→ 点我兑奖 ←</span>
        </div>
      </div>
      {createPortal(modal, document.body)}
    </div>
  )
}

export default App
