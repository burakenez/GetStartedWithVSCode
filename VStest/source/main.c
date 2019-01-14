/* Driver includes */

#include "cycfg.h"

int main(void)
{
  __enable_irq(); /* Enable global interrupts. */
  init_cycfg_all();

  for(;;){
    Cy_GPIO_Inv(LED_BLUE_PORT, LED_BLUE_NUM);
    Cy_SysLib_Delay(500);
  }
}

/* [] END OF FILE */
