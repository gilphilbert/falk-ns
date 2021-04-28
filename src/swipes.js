export default function Swipe(app){
    const Distance = 5;
    app.directive('swipe',{
      beforeMount:(el,binding)=>{
        let onTouch = false;
        let touches = 0
        el.addEventListener('touchstart',(e)=>{
           touches = e.touches;
          onTouch = true;
          el.addEventListener('touchmove', onTouchMove);
        })
        el.addEventListener('touchend', (e) => {
           touches = 0;
          el.removeEventListener('touchmove', onTouchMove);
        })
        function onTouchMove(e){
          if (onTouch){
            let mTouches = e.touches;
            // console.log(touches[0].screenX - mTouches[0].screenX)
            if (touches[0].screenX - mTouches[0].screenX > Distance) {
              // console.log('left');
              binding.value('left');
              onTouch = false;
            } else if (touches[0].screenX - mTouches[0].screenX < -Distance) {
              // console.log('right');
              binding.value('right');
              onTouch = false;
            }
            if (touches[0].screenY - mTouches[0].screenY > Distance) {
              // console.log('up')
              binding.value('up');
              onTouch = false;
            } else if (touches[0].screenY - mTouches[0].screenY < -Distance) {
              // console.log('down')
              binding.value('down');
              onTouch = false;
            }
            touches = mTouches;
          }
          
        }
      }
    })
  }